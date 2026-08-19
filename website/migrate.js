import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tfrnasqulivfzmyfskqy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcm5hc3F1bGl2ZnpteWZza3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTgxNjcsImV4cCI6MjA5MTY3NDE2N30.WiWtNAdpHA9AVihs5npYqupGfEFquw_t6NOexKjtSIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
    const { data: fds, error: fetchErr } = await supabase.from('fixed_departures').select('*');
    if (fetchErr) {
        console.error('Error fetching:', fetchErr);
        return;
    }
    
    for (const fd of fds) {
        console.log(`Adding ${fd.destination} to upcoming trips...`);
        const { error: insertErr } = await supabase.from('upcoming_trips').insert([{
            trip_name: fd.destination,
            start_date: fd.start_date,
            end_date: fd.end_date,
            guide_name: 'TBA',
            guide_contact: 'TBA'
        }]);
        if (insertErr) {
            console.error('Error inserting:', insertErr);
        } else {
            console.log(`Success!`);
        }
    }
}

migrateData();
