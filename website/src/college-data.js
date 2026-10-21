import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const TRIP_CODE = 'NOMAD-COLLEGE-2026';

// -------------------------------------------------------------
// DEFAULT TRIP CONFIGURATION (Can be customized dynamically)
// -------------------------------------------------------------
export const INITIAL_TRIP_DATA = {
  trip_code: TRIP_CODE,
  college_name: 'College of Engineering & Technology (CET)',
  trip_title: 'Annual Himalayan & Youth Adventure Expedition',
  destination: 'Manali • Solang Snow Valley • Kasol • Tosh Trek',
  duration: '5 Nights / 6 Days',
  dates: 'Nov 12 - Nov 17, 2026',
  coaches: '2 Luxury AC Air-Suspension BharatBenz Coaches',
  lead_faculty: 'Prof. K. Rajagopal (HOD)',
  faculty_phone: '+91 98470 12345',
  nomad_guide: 'Arjun Negi (Chief Guide)',
  nomad_phone: '+91 62389 98382',
  emergency_helpline: '+91 62389 98382',
  status: '🟢 In Progress - Safe & On Schedule',
  itinerary: [
    {
      day: 1,
      title: 'Departure & The Himalayan Ascent Drive',
      altitude: '2,050m (Manali)',
      stay: 'Mountain View Resort, Aleo',
      meals: 'Buffet Breakfast on highway • Lunch halt • Welcome Alpine Dinner',
      checkpoints: [
        {
          id: 'cp-1-1',
          time: '05:30 AM',
          title: 'Campus Assembly & Baggage Sanitization',
          desc: 'All students report to college main porch with faculty in-charge.',
          is_completed: true,
          completed_at: '2026-11-12T05:40:00Z',
          completed_by: 'Prof. K. Rajagopal'
        },
        {
          id: 'cp-1-2',
          time: '06:15 AM',
          title: 'Official Flag-Off & Departure',
          desc: 'Both coaches departed campus. Roll call verified 100% presence.',
          is_completed: true,
          completed_at: '2026-11-12T06:20:00Z',
          completed_by: 'Arjun Negi'
        },
        {
          id: 'cp-1-3',
          time: '09:00 AM',
          title: 'Highway Grand Express Breakfast Halt',
          desc: 'Students enjoying hot buffet breakfast and tea. Group on schedule.',
          is_completed: true,
          completed_at: '2026-11-12T09:15:00Z',
          completed_by: 'Prof. K. Rajagopal'
        },
        {
          id: 'cp-1-4',
          time: '05:30 PM',
          title: 'Resort Arrival & Room Check-in',
          desc: 'Coaches reached Mountain View Resort, Manali. Room keys handed over.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-1-5',
          time: '07:30 PM',
          title: 'Campfire Briefing & Expedition Dinner',
          desc: 'Safety guidelines, weather update & welcome dinner.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        }
      ]
    },
    {
      day: 2,
      title: 'Solang Valley Snow Trek & Acclimatization',
      altitude: '2,560m (Solang Valley)',
      stay: 'Mountain View Resort, Aleo',
      meals: 'Continental Breakfast • Packed Valley Lunch • Hot Soup & Dinner',
      checkpoints: [
        {
          id: 'cp-2-1',
          time: '07:30 AM',
          title: 'Morning Stretching & Fitness Warm-up',
          desc: 'Group fitness check before boarding coaches for Solang.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-2-2',
          time: '09:00 AM',
          title: 'Arrival at Solang Valley Base Point',
          desc: 'Coaches parked at snow point base. Trek gear distributed.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-2-3',
          time: '11:00 AM',
          title: 'Guided Acclimatization Hike to Waterfall',
          desc: 'Scenic mountain trail walk led by certified mountaineers.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-2-4',
          time: '02:00 PM',
          title: 'Packed Lunch & Snow Activities',
          desc: 'Warm meals served in heated shelter. Group photo session.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-2-5',
          time: '07:00 PM',
          title: 'Return to Resort, Bonfire & Acoustic Session',
          desc: 'All students accounted for back at resort rooms.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        }
      ]
    },
    {
      day: 3,
      title: 'Parvati Valley & The Tosh Village Trek',
      altitude: '2,400m (Tosh Village)',
      stay: 'Riverside Alpine Camps, Kasol',
      meals: 'Breakfast • Cafe Lunch in Kasol • Campfire BBQ & Dinner',
      checkpoints: [
        {
          id: 'cp-3-1',
          time: '07:00 AM',
          title: 'Scenic Drive along Parvati River Canyon',
          desc: 'Departure from Manali towards Kasol and Barshaini.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-3-2',
          time: '11:00 AM',
          title: 'Trek Commencement up to Tosh Village',
          desc: 'Hike across apple orchards and traditional wooden bridges.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-3-3',
          time: '05:00 PM',
          title: 'Descent to Riverside Campsite in Kasol',
          desc: 'Check-in to alpine tents, evening snacks & Parvati river breeze.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        }
      ]
    },
    {
      day: 4,
      title: 'Old Manali Heritage Walk & Mall Road Shopping',
      altitude: '2,050m',
      stay: 'Mountain View Resort, Aleo',
      meals: 'Breakfast • Local Himachali Dham • Farewell Gala Dinner',
      checkpoints: [
        {
          id: 'cp-4-1',
          time: '09:30 AM',
          title: 'Old Manali & Hadimba Temple Pine Forest Walk',
          desc: 'Cultural heritage tour and cedar forest exploration.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-4-2',
          time: '03:30 PM',
          title: 'Mall Road Shopping & Local Souvenirs',
          desc: 'Supervised free time for students in designated market zone.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-4-3',
          time: '07:30 PM',
          title: 'Gala DJ Night & Expedition Awards',
          desc: 'Celebration dinner and certificate distribution.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        }
      ]
    },
    {
      day: 5,
      title: 'Beas River Rafting & Homeward Journey',
      altitude: '1,500m (Kullu)',
      stay: 'Overnight in Luxury AC Coach',
      meals: 'Buffet Breakfast • Riverfront Lunch • Highway Dinner',
      checkpoints: [
        {
          id: 'cp-5-1',
          time: '08:00 AM',
          title: 'Resort Checkout & Drive to Kullu',
          desc: 'Baggage loaded into coaches. Proceed to rafting point.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-5-2',
          time: '10:00 AM',
          title: 'Grade-III Beas River Rafting with Kayak Escort',
          desc: 'Students equipped with certified life jackets & helmets.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        },
        {
          id: 'cp-5-3',
          time: '04:30 PM',
          title: 'Commence Return Drive Towards Campus',
          desc: 'Air-suspension coaches en route. Highway dinner stop scheduled.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        }
      ]
    },
    {
      day: 6,
      title: 'Safe Arrival at College Campus',
      altitude: 'College Campus',
      stay: 'Home',
      meals: 'Highway morning breakfast prior to arrival',
      checkpoints: [
        {
          id: 'cp-6-1',
          time: '08:00 AM',
          title: 'Arrival at College Gate & Parent Handover',
          desc: 'Trip concludes safely. Students dismissed to parents.',
          is_completed: false,
          completed_at: null,
          completed_by: null
        }
      ]
    }
  ],
  inclusions: [
    'Luxury AC Coach Transportation with commercial drivers & GPS tracking',
    'All Mountain Resort & Riverside Alpine Camp Stays (Triple / Quad sharing)',
    'Nutritious Buffet Meals (Breakfast, Lunch & Dinner as per itinerary) + evening tea',
    'Certified High-Altitude Mountaineering Guides & Wilderness First Responders (WFR)',
    'Comprehensive Medical Kit with Portable Oxygen Cylinders & Pulse Oximeters',
    'Forest Entry Permits, Green Tax, Tolls & Local Guide Logistics',
    'Evening Bonfire, Acoustic Setup & Campfire BBQ Night',
    'Full Group Travel & Accidental Insurance coverage for every student'
  ],
  exclusions: [
    'Personal expenses (shopping, personal cafe orders, laundry, phone recharge)',
    'Optional adventure sports not included in basic package (solo paragliding / zipline)',
    'Extra room service or personal room heater charges if opted individually',
    'Medical expenses exceeding travel insurance coverage'
  ]
};

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
    title: 'Flag-Off & Campus Departure Completed',
    description: 'Both luxury AC coaches have departed campus with faculty team and Nomadller leads. All 48 students accounted for.',
    location_name: 'College Campus Main Gate',
    update_type: 'Departure',
    posted_by: 'Prof. K. Rajagopal (HOD)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
  },
  {
    id: 'upd-2',
    trip_code: TRIP_CODE,
    title: 'Highway Breakfast Halt Completed',
    description: 'Students enjoyed a healthy buffet breakfast at Highway Grand Plaza. Roll call verified 100% presence before departure.',
    location_name: 'Highway Express Oasis',
    update_type: 'Meal',
    posted_by: 'Arjun Negi (Nomadller)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
  }
];

// LocalStorage helpers
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
    console.warn('Storage save error:', e);
  }
}

// -------------------------------------------------------------
// 1. Fetch Dynamic Trip Metadata (With Checkpoints & Itinerary)
// -------------------------------------------------------------
export async function fetchTripMetadata() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_trips')
        .select('*')
        .eq('trip_code', TRIP_CODE)
        .maybeSingle();

      if (data && !error) {
        const full = {
          ...INITIAL_TRIP_DATA,
          ...data,
          itinerary: (data.itinerary_data && data.itinerary_data.length > 0) ? data.itinerary_data : INITIAL_TRIP_DATA.itinerary,
          inclusions: (data.inclusions && data.inclusions.length > 0) ? data.inclusions : INITIAL_TRIP_DATA.inclusions,
          exclusions: (data.exclusions && data.exclusions.length > 0) ? data.exclusions : INITIAL_TRIP_DATA.exclusions
        };
        setStorage('trip_config', full);
        return full;
      }
    } catch (e) {
      console.warn('Supabase trip fetch failed, falling back to cache');
    }
  }
  return getStorage('trip_config', INITIAL_TRIP_DATA);
}

// -------------------------------------------------------------
// 2. Save Entire Dynamic Trip Configuration
// -------------------------------------------------------------
export async function saveTripConfig(newConfig) {
  const merged = { ...INITIAL_TRIP_DATA, ...newConfig, updated_at: new Date().toISOString() };
  setStorage('trip_config', merged);

  if (supabase) {
    try {
      await supabase
        .from('college_trips')
        .upsert({
          trip_code: TRIP_CODE,
          college_name: merged.college_name,
          trip_title: merged.trip_title,
          destination: merged.destination,
          dates: merged.dates,
          duration: merged.duration,
          coaches: merged.coaches,
          lead_faculty: merged.lead_faculty,
          faculty_phone: merged.faculty_phone,
          nomad_guide: merged.nomad_guide,
          nomad_phone: merged.nomad_phone,
          emergency_helpline: merged.emergency_helpline,
          itinerary_data: merged.itinerary,
          inclusions: merged.inclusions,
          exclusions: merged.exclusions
        }, { onConflict: 'trip_code' });
    } catch (e) {
      console.warn('Supabase trip config save failed, saved locally');
    }
  }

  return merged;
}

// -------------------------------------------------------------
// 3. THE GUIDE'S TICK SYSTEM: Toggle Itinerary Checkpoint
// -------------------------------------------------------------
export async function toggleCheckpoint(checkpointId, isCompleted, authorName = 'Guide Arjun Negi') {
  const trip = await fetchTripMetadata();
  let targetCheckpoint = null;
  let targetDayTitle = '';

  const updatedItinerary = trip.itinerary.map(day => {
    const updatedCheckpoints = (day.checkpoints || []).map(cp => {
      if (cp.id === checkpointId) {
        targetCheckpoint = {
          ...cp,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          completed_by: isCompleted ? authorName : null
        };
        targetDayTitle = day.title;
        return targetCheckpoint;
      }
      return cp;
    });
    return { ...day, checkpoints: updatedCheckpoints };
  });

  trip.itinerary = updatedItinerary;
  await saveTripConfig(trip);

  // Automatically broadcast this milestone to the parent feed if marked complete!
  if (isCompleted && targetCheckpoint) {
    await postLiveUpdate({
      title: `Checkpoint Completed: ${targetCheckpoint.title}`,
      description: `${targetCheckpoint.desc || ''} (Verified on time by ${authorName}).`,
      location_name: targetDayTitle || trip.destination,
      update_type: 'Milestone',
      posted_by: authorName
    });
  }

  return trip;
}

// -------------------------------------------------------------
// 4. Students Management
// -------------------------------------------------------------
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
      console.warn('Supabase students fetch failed, using local');
    }
  }
  return getStorage('students', DEFAULT_STUDENTS);
}

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
      console.warn('Supabase student insert error, saving to cache');
    }
  }

  const current = getStorage('students', DEFAULT_STUDENTS);
  const updated = [newStudent, ...current];
  setStorage('students', updated);
  return newStudent;
}

export async function updateStudentAttendance(id, newStatus, newNotes = '') {
  if (supabase) {
    try {
      await supabase
        .from('college_students')
        .update({ status: newStatus, notes: newNotes, last_update: `Status: ${newStatus}` })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase attendance update failed');
    }
  }

  const current = getStorage('students', DEFAULT_STUDENTS);
  const updated = current.map(s => {
    if (s.id === id) {
      return { 
        ...s, 
        status: newStatus, 
        notes: newNotes || s.notes, 
        last_update: `Status: ${newStatus} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` 
      };
    }
    return s;
  });
  setStorage('students', updated);
  return updated;
}

export async function deleteStudent(id) {
  if (supabase) {
    try {
      await supabase.from('college_students').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed');
    }
  }
  const current = getStorage('students', DEFAULT_STUDENTS);
  const updated = current.filter(s => s.id !== id);
  setStorage('students', updated);
  return updated;
}

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

// -------------------------------------------------------------
// 5. Parent Live Broadcast Updates
// -------------------------------------------------------------
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
      console.warn('Saved update to cache');
    }
  }

  const current = getStorage('updates', DEFAULT_UPDATES);
  const updated = [newUpdate, ...current];
  setStorage('updates', updated);
  return newUpdate;
}
