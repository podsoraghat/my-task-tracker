const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cracxeobqswrkikkhlbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWN4ZW9icXN3cmtpa2tobGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDU5OTIsImV4cCI6MjA4NjcyMTk5Mn0.wnpMbWyNS-fYNs-iy3SOkS6mO14ALLWq2gJMFp3DYO4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Checking for profiles table ---');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
    if (pError) console.log('Profiles table error:', pError.message);
    else console.log('Profiles table exists:', profiles);

    console.log('\n--- Checking for unique users in tasks table ---');
    const { data: tasks, error: tError } = await supabase.from('tasks').select('user_id, user_name');
    if (tError) console.log('Tasks table error:', tError.message);
    else {
        const uniqueUsers = Array.from(new Set(tasks.map(t => JSON.stringify({ id: t.user_id, name: t.user_name }))))
            .map(s => JSON.parse(s));
        console.log('Unique users found in tasks:', uniqueUsers);
    }
}

debug();
