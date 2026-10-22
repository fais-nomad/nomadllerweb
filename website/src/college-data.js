import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const TRIP_CODE = 'NOMAD-COLLEGE-2026';

// -------------------------------------------------------------
// DEFAULT TRIP CONFIGURATION (100% Dynamic, no hardcoded tour data)
// -------------------------------------------------------------
export const INITIAL_TRIP_DATA = {
  trip_code: TRIP_CODE,
  college_name: 'College Youth Expedition',
  trip_title: 'Annual College Expedition',
  destination: 'Expedition Destination',
  duration: '5 Nights / 6 Days',
  dates: 'Dates Upcoming',
  lead_faculty: '',
  faculty_phone: '',
  nomad_guide: '',
  nomad_phone: '',
  emergency_helpline: '+91 62389 98382',
  status: '🟢 Trip Planning Active',
  itinerary: [],
  inclusions: [],
  exclusions: [],
  packing_list: []
};

const DEFAULT_STUDENTS = [];
const DEFAULT_UPDATES = [];

// Purge legacy mock data cache from previous hardcoded versions
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('nomad_college_trip_config');
    localStorage.removeItem('nomad_college_students');
    localStorage.removeItem('nomad_college_updates');
  }
} catch (e) {}

const STORAGE_PREFIX = 'nomad_college_v3_';

// LocalStorage helpers
function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

// -------------------------------------------------------------
// 1. Fetch Dynamic Trip Metadata (With Checkpoints & Itinerary)
// -------------------------------------------------------------
export async function fetchTripMetadata() {
  const cached = getStorage('trip_config', INITIAL_TRIP_DATA);

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
          ...cached,
          ...data,
          college_name: data.college_name || cached.college_name || INITIAL_TRIP_DATA.college_name,
          trip_title: data.trip_title || cached.trip_title || INITIAL_TRIP_DATA.trip_title,
          destination: data.destination || cached.destination || INITIAL_TRIP_DATA.destination,
          dates: data.dates || cached.dates || INITIAL_TRIP_DATA.dates,
          duration: data.duration || cached.duration || INITIAL_TRIP_DATA.duration,
          lead_faculty: data.lead_faculty !== undefined ? (data.lead_faculty || data.coordinator_name || '') : (cached.lead_faculty || ''),
          faculty_phone: data.faculty_phone !== undefined ? (data.faculty_phone || data.coordinator_phone || '') : (cached.faculty_phone || ''),
          nomad_guide: data.nomad_guide !== undefined ? (data.nomad_guide || data.guide_name || '') : (cached.nomad_guide || ''),
          nomad_phone: data.nomad_phone !== undefined ? (data.nomad_phone || data.guide_phone || '') : (cached.nomad_phone || ''),
          emergency_helpline: data.emergency_helpline || data.guide_phone || cached.emergency_helpline || INITIAL_TRIP_DATA.emergency_helpline,
          itinerary: Array.isArray(data.itinerary_data)
            ? data.itinerary_data
            : (Array.isArray(cached.itinerary) ? cached.itinerary : []),
          inclusions: Array.isArray(data.inclusions)
            ? data.inclusions
            : (Array.isArray(cached.inclusions) ? cached.inclusions : []),
          exclusions: Array.isArray(data.exclusions)
            ? data.exclusions
            : (Array.isArray(cached.exclusions) ? cached.exclusions : []),
          packing_list: Array.isArray(data.packing_list)
            ? data.packing_list
            : (Array.isArray(cached.packing_list) ? cached.packing_list : [])
        };
        setStorage('trip_config', full);
        return full;
      }
    } catch (e) {
      console.warn('Supabase trip fetch failed, falling back to cache:', e);
    }
  }
  return cached;
}

// -------------------------------------------------------------
// 2. Save Entire Dynamic Trip Configuration
// -------------------------------------------------------------
export async function saveTripConfig(newConfig) {
  const cached = getStorage('trip_config', INITIAL_TRIP_DATA);
  const merged = { ...cached, ...newConfig, updated_at: new Date().toISOString() };
  setStorage('trip_config', merged);

  if (supabase) {
    try {
      const payload = {
        trip_code: TRIP_CODE,
        college_name: merged.college_name || '',
        trip_title: merged.trip_title || '',
        destination: merged.destination || '',
        dates: merged.dates || '',
        duration: merged.duration || '',
        lead_faculty: merged.lead_faculty || '',
        faculty_phone: merged.faculty_phone || '',
        nomad_guide: merged.nomad_guide || '',
        nomad_phone: merged.nomad_phone || '',
        emergency_helpline: merged.emergency_helpline || '',
        itinerary_data: merged.itinerary || [],
        inclusions: merged.inclusions || [],
        exclusions: merged.exclusions || [],
        packing_list: merged.packing_list || [],
        updated_at: new Date().toISOString()
      };

      // Also set legacy column names for 100% backward compatibility
      payload.coordinator_name = merged.lead_faculty || '';
      payload.coordinator_phone = merged.faculty_phone || '';
      payload.guide_name = merged.nomad_guide || '';
      payload.guide_phone = merged.nomad_phone || merged.emergency_helpline || '';

      const { error } = await supabase
        .from('college_trips')
        .upsert(payload, { onConflict: 'trip_code' });

      if (error) {
        console.warn('Supabase upsert returned error, attempting update on existing columns:', error);
        await supabase
          .from('college_trips')
          .update(payload)
          .eq('trip_code', TRIP_CODE);
      }
    } catch (e) {
      console.warn('Supabase trip config save failed, saved locally:', e);
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
// 3.5 DYNAMIC ITINERARY BUILDER & CRUD OPERATIONS
// -------------------------------------------------------------
export async function addItineraryDay({ title, stay = '', altitude = '', meals = '' }) {
  const trip = await fetchTripMetadata();
  const days = trip.itinerary || [];
  const nextDayNum = days.length > 0 ? Math.max(...days.map(d => d.day || 0)) + 1 : 1;
  const newDay = {
    day: nextDayNum,
    title: title || `Day ${nextDayNum} Exploration`,
    stay: stay || 'Resort / Alpine Camp',
    altitude: altitude || '',
    meals: meals || 'Breakfast • Lunch • Dinner',
    checkpoints: [
      {
        id: `cp-${nextDayNum}-1`,
        time: '08:00 AM',
        title: 'Morning Briefing & Breakfast',
        desc: `Roll call and start of Day ${nextDayNum} tour activities.`,
        is_completed: false,
        completed_at: null,
        completed_by: null
      }
    ]
  };
  trip.itinerary = [...days, newDay];
  await saveTripConfig(trip);
  return trip;
}

export async function deleteItineraryDay(dayNumber) {
  const trip = await fetchTripMetadata();
  trip.itinerary = (trip.itinerary || [])
    .filter(d => d.day !== dayNumber)
    .map((d, index) => ({ ...d, day: index + 1 }));
  await saveTripConfig(trip);
  return trip;
}

export async function addItineraryCheckpoint(dayNumber, { time, title, desc }) {
  const trip = await fetchTripMetadata();
  const day = (trip.itinerary || []).find(d => d.day === dayNumber);
  if (!day) return trip;
  if (!day.checkpoints) day.checkpoints = [];
  const newCp = {
    id: `cp-${dayNumber}-${Date.now()}`,
    time: time || '12:00 PM',
    title: title || 'Scheduled Milestone',
    desc: desc || '',
    is_completed: false,
    completed_at: null,
    completed_by: null
  };
  day.checkpoints.push(newCp);
  await saveTripConfig(trip);
  return trip;
}

export async function deleteItineraryCheckpoint(checkpointId) {
  const trip = await fetchTripMetadata();
  trip.itinerary = (trip.itinerary || []).map(day => ({
    ...day,
    checkpoints: (day.checkpoints || []).filter(cp => cp.id !== checkpointId)
  }));
  await saveTripConfig(trip);
  return trip;
}

export async function clearAllItineraryDays() {
  const trip = await fetchTripMetadata();
  trip.itinerary = [];
  await saveTripConfig(trip);
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

      if (data && !error) {
        setStorage('students', data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase students fetch failed, using local');
    }
  }
  return getStorage('students', []);
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

      if (data && !error) {
        setStorage('updates', data);
        return data;
      }
    } catch (e) {
      console.warn('Using local updates');
    }
  }
  return getStorage('updates', []);
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
