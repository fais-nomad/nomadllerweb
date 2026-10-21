import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const TRIP_CODE = 'NOMAD-COLLEGE-2026';

// Realistic Default Pre-seeded Data for Immediate Out-Of-The-Box Reliability
const DEFAULT_TRIP = {
  trip_code: TRIP_CODE,
  college_name: 'College of Engineering & Technology (CET)',
  trip_title: 'Annual Youth Adventure & Himalayan Highland Expedition',
  destination: 'Manali • Solang Valley • Kasol • Tosh Trek',
  duration: '5 Nights / 6 Days',
  dates: 'Nov 12 - Nov 17, 2026',
  total_students: 48,
  coaches: '2 Luxury AC BharatBenz Air-Suspension Coaches',
  lead_faculty: 'Prof. K. Rajagopal (HOD Mechanical)',
  faculty_phone: '+91 98470 12345',
  nomad_guide: 'Arjun Negi (Chief High-Altitude Guide)',
  nomad_phone: '+91 62389 98382',
  emergency_helpline: '+91 62389 98382',
  status: '🟢 In Progress - Safe & On Schedule'
};

const DEFAULT_ITINERARY = [
  {
    day: 1,
    title: 'Departure & The Himalayan Ascent Drive',
    altitude: '2,050m (Manali)',
    stay: 'Luxury Mountain View Resort, Aleo',
    meals: 'Buffet Breakfast on highway • Lunch halt • Welcome Alpine Dinner',
    events: [
      { time: '05:30 AM', desc: 'Reporting at College Campus Main Gate & Baggage Sanity Check' },
      { time: '06:15 AM', desc: 'Official Flag-Off by Principal & Faculty Team' },
      { time: '09:00 AM', desc: 'Highway Grand Express breakfast buffet halt' },
      { time: '05:30 PM', desc: 'Arrival in Manali, room allocation & tea/snacks' },
      { time: '07:30 PM', desc: 'Trip briefing & do\'s and don\'ts with Nomadller expedition team' }
    ]
  },
  {
    day: 2,
    title: 'Solang Valley Snow Trek & Acclimatization Walk',
    altitude: '2,560m (Solang Valley)',
    stay: 'Luxury Mountain View Resort, Aleo',
    meals: 'Continental Breakfast • Packed Valley Lunch • Hot Soup & Dinner',
    events: [
      { time: '07:30 AM', desc: 'Morning stretching & fitness warm-up' },
      { time: '09:00 AM', desc: 'Drive to Solang Valley base point' },
      { time: '10:30 AM', desc: 'Guided acclimatization trek to Anjani Mahadev waterfall' },
      { time: '02:00 PM', desc: 'Optional paragliding & zorbing under certified instructor supervision' },
      { time: '07:00 PM', desc: 'Bonfire, live acoustic music & group debrief' }
    ]
  },
  {
    day: 3,
    title: 'Kasol Valley & The Tosh Alpine Village Trek',
    altitude: '2,400m (Tosh Village)',
    stay: 'Alpine Riverside Tents / Cottages, Kasol',
    meals: 'Breakfast • Cafe Lunch in Kasol • Campfire BBQ & Dinner',
    events: [
      { time: '07:00 AM', desc: 'Scenic morning drive along the Parvati River canyon' },
      { time: '11:00 AM', desc: 'Trek commencement from Barshaini up to Tosh village' },
      { time: '01:30 PM', desc: 'Explore traditional wooden architecture & apple orchards' },
      { time: '05:00 PM', desc: 'Descent to riverside campsite in Kasol' },
      { time: '08:00 PM', desc: 'Acoustic jam session & hot fresh dinner' }
    ]
  },
  {
    day: 4,
    title: 'Old Manali Culture Walk, Hadimba Temple & Mall Road',
    altitude: '2,050m',
    stay: 'Luxury Mountain View Resort, Aleo',
    meals: 'Breakfast • Local Himachali Dham Lunch • Farewell Banquet',
    events: [
      { time: '09:30 AM', desc: 'Heritage walk through old Manali cedar forests & Hadimba Shrine' },
      { time: '01:00 PM', desc: 'Authentic Himachali lunch & cafe exploration' },
      { time: '03:30 PM', desc: 'Souvenir shopping, local handicrafts & street food on Mall Road' },
      { time: '07:30 PM', desc: 'Gala DJ night & college awards presentation' }
    ]
  },
  {
    day: 5,
    title: 'River Rafting in Beas & Homeward Journey',
    altitude: '1,500m (Kullu)',
    stay: 'Overnight Journey in Luxury AC Coach',
    meals: 'Buffet Breakfast • Riverfront Lunch • Highway Dinner',
    events: [
      { time: '08:00 AM', desc: 'Checkout & proceed to Kullu rafting point' },
      { time: '10:00 AM', desc: 'Grade-III Beas river rafting with lifejackets & rescue kayakers' },
      { time: '02:00 PM', desc: 'Lunch and freshen up at Kullu river lounge' },
      { time: '04:30 PM', desc: 'Commence comfortable return drive' }
    ]
  },
  {
    day: 6,
    title: 'Safe Arrival Back at College Campus',
    altitude: 'Campus',
    stay: 'Home',
    meals: 'Morning highway breakfast prior to arrival',
    events: [
      { time: '08:00 AM', desc: 'Buses reach college campus safely. Handover to parents & students dismissal.' }
    ]
  }
];

const DEFAULT_INCLUSIONS = [
  'Luxury AC Coach Transportation with certified commercial drivers & GPS tracking',
  'All 3 Star Mountain Resort & Riverside Alpine Camp stays (Quad / Triple sharing)',
  'Nutritious Buffet Meals (Breakfast, Lunch & Dinner as per itinerary) + evening tea',
  'Certified High-Altitude Mountaineering Guides & Wilderness First Responders (WFR)',
  'Comprehensive Medical Kit with Portable Oxygen Cylinders & Pulse Oximeters',
  'Forest Entry Permits, Green Tax, Tolls & Local Guide Logistics',
  'Evening Bonfire, Acoustic Setup & Campfire BBQ Night',
  'Full Group Travel & Accidental Insurance coverage for every student'
];

const DEFAULT_EXCLUSIONS = [
  'Personal expenses (shopping, personal cafe orders, laundry, phone recharge)',
  'Optional adventure sports not included in basic package (solo paragliding / zipline)',
  'Extra room orders or personal heater charges if opted individually',
  'Medical expenses exceeding travel insurance coverage'
];

const DEFAULT_STUDENTS = [
  {
    id: 'std-1',
    trip_code: TRIP_CODE,
    name: 'Aditya Varma',
    roll_no: 'CET-CS-042',
    department: 'Computer Science',
    phone: '+91 98461 22334',
    parent_name: 'Dr. Suresh Varma',
    parent_phone: '+91 94471 55667',
    blood_group: 'O +ve',
    food_preference: 'Non-Veg',
    bus_no: 'Bus 1 (Seat 12)',
    room_no: 'Room 204 (Pine Wing)',
    status: 'Present',
    last_update: 'Checked into Resort Room 204'
  },
  {
    id: 'std-2',
    trip_code: TRIP_CODE,
    name: 'Devika Menon',
    roll_no: 'CET-CS-019',
    department: 'Computer Science',
    phone: '+91 98950 33445',
    parent_name: 'Prakash Menon',
    parent_phone: '+91 94470 88990',
    blood_group: 'B +ve',
    food_preference: 'Veg',
    bus_no: 'Bus 1 (Seat 14)',
    room_no: 'Room 206 (Pine Wing)',
    status: 'Present',
    last_update: 'Checked into Resort Room 206'
  },
  {
    id: 'std-3',
    trip_code: TRIP_CODE,
    name: 'Fahad Mohammed',
    roll_no: 'CET-ME-055',
    department: 'Mechanical',
    phone: '+91 97455 66778',
    parent_name: 'K. M. Mohammed',
    parent_phone: '+91 98471 22110',
    blood_group: 'A +ve',
    food_preference: 'Non-Veg',
    bus_no: 'Bus 2 (Seat 08)',
    room_no: 'Room 302 (Cedar Wing)',
    status: 'Present',
    last_update: 'Present at Solang Valley Base'
  },
  {
    id: 'std-4',
    trip_code: TRIP_CODE,
    name: 'Ananya Sharma',
    roll_no: 'CET-EC-008',
    department: 'Electronics',
    phone: '+91 99955 44332',
    parent_name: 'Rajesh Sharma',
    parent_phone: '+91 94460 11223',
    blood_group: 'AB +ve',
    food_preference: 'Veg',
    bus_no: 'Bus 2 (Seat 11)',
    room_no: 'Room 305 (Cedar Wing)',
    status: 'Present',
    last_update: 'Checked into Resort Room 305'
  },
  {
    id: 'std-5',
    trip_code: TRIP_CODE,
    name: 'Gautam Nair',
    roll_no: 'CET-CE-031',
    department: 'Civil Engg',
    phone: '+91 98472 77889',
    parent_name: 'Sunil Nair',
    parent_phone: '+91 94472 99001',
    blood_group: 'O -ve',
    food_preference: 'Non-Veg',
    bus_no: 'Bus 1 (Seat 22)',
    room_no: 'Room 208 (Pine Wing)',
    status: 'On Bus',
    last_update: 'On Board Bus 1'
  }
];

const DEFAULT_UPDATES = [
  {
    id: 'upd-1',
    trip_code: TRIP_CODE,
    title: 'Trip Flag-Off & Campus Departure Completed',
    description: 'All students accounted for. Both coaches departed on schedule with Faculty team and Nomadller leads. High energy throughout!',
    location_name: 'College Campus Main Gate',
    update_type: 'Departure',
    posted_by: 'Prof. K. Rajagopal (HOD)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
  },
  {
    id: 'upd-2',
    trip_code: TRIP_CODE,
    title: 'Breakfast & Refreshment Halt',
    description: 'Students enjoyed a healthy buffet breakfast at Highway Plaza. Roll call verified 100% attendance before boarding.',
    location_name: 'Highway Express Oasis',
    update_type: 'Meal',
    posted_by: 'Arjun Negi (Nomadller)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
  },
  {
    id: 'upd-3',
    trip_code: TRIP_CODE,
    title: 'Resort Arrival & Safe Room Allocation',
    description: 'We have checked in to Mountain View Resort. Welcome herbal tea served, luggage placed in respective rooms. Evening campfire session scheduled for 7:30 PM.',
    location_name: 'Mountain View Resort, Aleo, Manali',
    update_type: 'Hotel',
    posted_by: 'Prof. K. Rajagopal (HOD)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  }
];

// Helper to access LocalStorage cache
function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem('nomad_college_' + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem('nomad_college_' + key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

// 1. Get Trip Metadata & Itinerary
export async function fetchTripMetadata() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_trips')
        .select('*')
        .eq('trip_code', TRIP_CODE)
        .maybeSingle();

      if (data && !error) {
        return { ...DEFAULT_TRIP, ...data, itinerary: DEFAULT_ITINERARY, inclusions: DEFAULT_INCLUSIONS, exclusions: DEFAULT_EXCLUSIONS };
      }
    } catch (e) {
      console.warn('Using default trip metadata');
    }
  }
  return { ...DEFAULT_TRIP, itinerary: DEFAULT_ITINERARY, inclusions: DEFAULT_INCLUSIONS, exclusions: DEFAULT_EXCLUSIONS };
}

// 2. Get All Students
export async function fetchStudents() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_students')
        .select('*')
        .eq('trip_code', TRIP_CODE)
        .order('name', { ascending: true });

      if (data && data.length > 0 && !error) {
        setStorage('students', data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local data');
    }
  }
  return getStorage('students', DEFAULT_STUDENTS);
}

// 3. Register a New Student
export async function registerStudent(studentData) {
  const newStudent = {
    id: 'std-' + Date.now(),
    trip_code: TRIP_CODE,
    status: 'Present',
    last_update: 'Self-Registered Online',
    created_at: new Date().toISOString(),
    ...studentData
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_students')
        .insert([newStudent])
        .select()
        .single();
      if (!error && data) {
        const local = getStorage('students', DEFAULT_STUDENTS);
        setStorage('students', [data, ...local]);
        return data;
      }
    } catch (e) {
      console.warn('Supabase insert failed, saving locally');
    }
  }

  // Local storage save
  const current = getStorage('students', DEFAULT_STUDENTS);
  const updated = [newStudent, ...current];
  setStorage('students', updated);
  return newStudent;
}

// 4. Update Student Status (Attendance by Teacher)
export async function updateStudentAttendance(id, newStatus, newNotes = '') {
  if (supabase) {
    try {
      await supabase
        .from('college_students')
        .update({ status: newStatus, notes: newNotes })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase update failed');
    }
  }

  const current = getStorage('students', DEFAULT_STUDENTS);
  const updated = current.map(s => {
    if (s.id === id) {
      return { ...s, status: newStatus, notes: newNotes || s.notes, last_update: 'Status updated to: ' + newStatus };
    }
    return s;
  });
  setStorage('students', updated);
  return updated;
}

// 5. Get Real-Time Live Updates (Parent Feed)
export async function fetchLiveUpdates() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_updates')
        .select('*')
        .eq('trip_code', TRIP_CODE)
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        setStorage('updates', data);
        return data;
      }
    } catch (e) {
      console.warn('Using local updates');
    }
  }
  return getStorage('updates', DEFAULT_UPDATES);
}

// 6. Broadcast New Milestone / Update (by Teacher)
export async function postLiveUpdate(updateData) {
  const newUpdate = {
    id: 'upd-' + Date.now(),
    trip_code: TRIP_CODE,
    created_at: new Date().toISOString(),
    ...updateData
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_updates')
        .insert([newUpdate])
        .select()
        .single();

      if (!error && data) {
        const local = getStorage('updates', DEFAULT_UPDATES);
        setStorage('updates', [data, ...local]);
        return data;
      }
    } catch (e) {
      console.warn('Supabase broadcast failed, saved to local cache');
    }
  }

  const current = getStorage('updates', DEFAULT_UPDATES);
  const updated = [newUpdate, ...current];
  setStorage('updates', updated);
  return newUpdate;
}

// 7. Find Student by Roll No (for Parent Verification)
export async function lookupStudent(query) {
  const students = await fetchStudents();
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return null;

  return students.find(s => 
    (s.roll_no && s.roll_no.toLowerCase().includes(clean)) ||
    (s.name && s.name.toLowerCase().includes(clean)) ||
    (s.phone && s.phone.includes(clean))
  );
}
