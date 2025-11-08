const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function debugChat() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('=== FULL CHAT DEBUG ===\n');

  // 1. Check users
  const { data: users } = await supabase.from('users').select('user_id, email, full_name');
  console.log('Users:', users?.length);
  users?.forEach(u => console.log(`  - ${u.full_name} (${u.email})`));

  // 2. Check matches
  const { data: matches } = await supabase.from('matches').select('*');
  console.log('\nMatches:', matches?.length);
  matches?.forEach(m => {
    const user1 = users?.find(u => u.user_id === m.user1_id);
    const user2 = users?.find(u => u.user_id === m.user2_id);
    console.log(`  - ${user1?.full_name} <-> ${user2?.full_name} (Match ID: ${m.id})`);
  });

  // 3. Check messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\nMessages:', messages?.length);
  if (msgError) {
    console.error('Message query error:', msgError);
  }
  
  messages?.forEach(msg => {
    const sender = users?.find(u => u.user_id === msg.sender_id);
    const match = matches?.find(m => m.id === msg.match_id);
    console.log(`  - From ${sender?.full_name}: "${msg.content}" (${new Date(msg.created_at).toLocaleTimeString()})`);
  });

  // 4. Test sending message from each user
  if (matches && matches.length > 0 && users && users.length >= 2) {
    console.log('\n=== TESTING MESSAGE SEND ===');
    
    const testMatch = matches[0];
    const sender = users[0];
    
    console.log(`Sending test message from ${sender.full_name}...`);
    
    const { data: newMsg, error: sendError } = await supabase
      .from('messages')
      .insert({
        match_id: testMatch.id,
        sender_id: sender.user_id,
        content: `Test at ${new Date().toLocaleTimeString()}`,
        image_url: null
      })
      .select()
      .single();

    if (sendError) {
      console.error('❌ Send failed:', sendError);
    } else {
      console.log('✅ Message sent:', newMsg.id);
    }

    // 5. Verify both users can see messages
    console.log('\n=== CHECKING MESSAGE VISIBILITY ===');
    
    for (const user of [testMatch.user1_id, testMatch.user2_id]) {
      const userName = users.find(u => u.user_id === user)?.full_name;
      
      // Check what matches this user sees
      const { data: userMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('user1_id', user);

      console.log(`\n${userName} sees ${userMatches?.length || 0} matches`);
      
      if (userMatches && userMatches.length > 0) {
        const matchId = userMatches[0].id;
        const { data: userMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: false })
          .limit(5);

        console.log(`  Messages in match: ${userMessages?.length || 0}`);
        userMessages?.forEach(m => {
          const from = users.find(u => u.user_id === m.sender_id)?.full_name;
          console.log(`    - ${from}: "${m.content}"`);
        });
      }
    }
  }

  // 6. Check RLS policies
  console.log('\n=== CHECKING RLS POLICIES ===');
  const { data: policies } = await supabase.rpc('exec_sql', {
    sql: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages'`
  }).catch(() => ({ data: null }));
  
  if (policies) {
    console.log('Message policies:', policies);
  } else {
    console.log('Could not check policies (need admin access)');
  }

  // 7. Check realtime
  console.log('\n=== CHECKING REALTIME ===');
  const { data: realtimeData } = await supabase
    .from('messages')
    .select('id')
    .limit(1);
  
  if (realtimeData) {
    console.log('✅ Can query messages table');
  }
}

debugChat().catch(console.error);
