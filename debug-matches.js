const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function debugMatches() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('=== DEBUGGING MATCHES ===\n');

  // 1. Check all users
  const { data: users } = await supabase.from('users').select('user_id, email, full_name');
  console.log('Total users:', users?.length);
  console.log('Users:', JSON.stringify(users, null, 2));

  // 2. Check profiles
  const { data: profiles } = await supabase.from('student_profiles').select('*');
  console.log('\nTotal profiles:', profiles?.length);
  console.log('Profiles:', JSON.stringify(profiles, null, 2));

  // 3. Check classes
  const { data: classes } = await supabase.from('student_classes').select('*');
  console.log('\nTotal classes:', classes?.length);
  console.log('Classes:', JSON.stringify(classes, null, 2));

  // 4. Check preferences
  const { data: prefs } = await supabase.from('study_preferences').select('*');
  console.log('\nTotal preferences:', prefs?.length);
  console.log('Preferences:', JSON.stringify(prefs, null, 2));

  // 5. Manual matching calculation
  console.log('\n=== MANUAL MATCHING ===\n');
  
  if (profiles && profiles.length >= 2) {
    const user1 = profiles[0];
    const user2 = profiles[1];
    
    const user1Classes = classes?.filter(c => c.user_id === user1.user_id).map(c => c.class_code) || [];
    const user2Classes = classes?.filter(c => c.user_id === user2.user_id).map(c => c.class_code) || [];
    
    const user1Prefs = prefs?.find(p => p.user_id === user1.user_id);
    const user2Prefs = prefs?.find(p => p.user_id === user2.user_id);
    
    console.log('User 1:', user1.user_id);
    console.log('  Major:', user1.major);
    console.log('  Year:', user1.year_of_study);
    console.log('  Classes:', user1Classes);
    console.log('  Study Time:', user1Prefs?.study_time_preference);
    console.log('  Location:', user1Prefs?.study_location_preference);
    console.log('  Style:', user1Prefs?.study_style);
    
    console.log('\nUser 2:', user2.user_id);
    console.log('  Major:', user2.major);
    console.log('  Year:', user2.year_of_study);
    console.log('  Classes:', user2Classes);
    console.log('  Study Time:', user2Prefs?.study_time_preference);
    console.log('  Location:', user2Prefs?.study_location_preference);
    console.log('  Style:', user2Prefs?.study_style);
    
    const matchCriteria = {
      classes: user1Classes.some(code => user2Classes.includes(code)),
      major: user1.major === user2.major,
      year: user1.year_of_study === user2.year_of_study,
      studyTime: (user1Prefs?.study_time_preference || []).some(time => 
        (user2Prefs?.study_time_preference || []).includes(time)
      ),
      location: (user1Prefs?.study_location_preference || []).some(loc => 
        (user2Prefs?.study_location_preference || []).includes(loc)
      ),
      style: (user1Prefs?.study_style || []).some(style => 
        (user2Prefs?.study_style || []).includes(style)
      )
    };
    
    console.log('\nMatch Criteria:');
    console.log(JSON.stringify(matchCriteria, null, 2));
    
    const matchingFactors = Object.values(matchCriteria).filter(Boolean).length;
    const score = (matchingFactors / 6) * 100;
    
    console.log('\nMatching Factors:', matchingFactors, '/ 6');
    console.log('Compatibility Score:', score.toFixed(2) + '%');
  }

  // 6. Check existing matches
  const { data: matches } = await supabase.from('matches').select('*');
  console.log('\n=== EXISTING MATCHES ===');
  console.log('Total matches:', matches?.length);
  console.log('Matches:', JSON.stringify(matches, null, 2));

  // 7. Clear and recalculate
  console.log('\n=== RECALCULATING ===\n');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  for (const profile of profiles || []) {
    if (!profile.profile_completed) continue;
    
    console.log('Calculating matches for:', profile.user_id);
    
    const response = await fetch('http://localhost:3001/api/matches/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.user_id })
    });
    
    const result = await response.json();
    console.log('Result:', result);
  }

  // 8. Check final matches
  const { data: finalMatches } = await supabase.from('matches').select('*');
  console.log('\n=== FINAL MATCHES ===');
  console.log('Total matches:', finalMatches?.length);
  console.log('Matches:', JSON.stringify(finalMatches, null, 2));
}

debugMatches().catch(console.error);
