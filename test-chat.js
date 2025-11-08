const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function testChat() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('=== TESTING CHAT SYSTEM ===\n');

  // 1. Check matches
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*');
  
  console.log('Matches:', matches?.length || 0);
  if (matchError) console.error('Match error:', matchError);

  // 2. Check messages table structure
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(5);
  
  console.log('\nMessages:', messages?.length || 0);
  if (msgError) console.error('Message error:', msgError);
  if (messages && messages.length > 0) {
    console.log('Sample message:', JSON.stringify(messages[0], null, 2));
  }

  // 3. Test sending a message
  if (matches && matches.length > 0) {
    const testMatch = matches[0];
    console.log('\n=== TESTING MESSAGE SEND ===');
    console.log('Match ID:', testMatch.id);
    console.log('User1:', testMatch.user1_id);
    console.log('User2:', testMatch.user2_id);

    const { data: newMsg, error: sendError } = await supabase
      .from('messages')
      .insert({
        match_id: testMatch.id,
        sender_id: testMatch.user1_id,
        content: 'Test message from script',
        image_url: null
      })
      .select()
      .single();

    if (sendError) {
      console.error('Send error:', sendError);
    } else {
      console.log('✅ Message sent successfully!');
      console.log('New message:', JSON.stringify(newMsg, null, 2));
    }

    // 4. Verify message was saved
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', testMatch.id)
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('\nRecent messages for this match:', allMessages?.length || 0);
    allMessages?.forEach(msg => {
      console.log(`- ${msg.content} (${new Date(msg.created_at).toLocaleTimeString()})`);
    });
  }

  // 5. Check storage bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('\n=== STORAGE BUCKETS ===');
  console.log('Buckets:', buckets?.map(b => b.name).join(', '));
  
  const chatBucket = buckets?.find(b => b.name === 'chat-images');
  if (chatBucket) {
    console.log('✅ chat-images bucket exists');
    console.log('Public:', chatBucket.public);
  } else {
    console.log('❌ chat-images bucket NOT found');
  }
}

testChat().catch(console.error);
