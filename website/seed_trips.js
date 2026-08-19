import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);

const valleyOfFlowers = {
    title: 'Valley of Flowers',
    subtitle: 'A Luxury Uttarakhand Journey',
    duration: '6 DAYS',
    difficulty: 'MODERATE',
    cost: '12999',
    cover_image_url: '/images/valley-flowers.webp', // Assuming generic name
    highlights: ['UNESCO World Heritage Site', 'Rare Alpine Flowers', 'Hemkund Sahib Trek', 'Luxury Stays'],
    itinerary: JSON.stringify([
        { day: 1, title: 'Rishikesh to Govindghat', desc: 'Our representative will meet you in Rishikesh, and you will start your journey towards Govindghat. The journey will take 9 to 10 hours, during which you can enjoy the beautiful landscapes. You will reach Govindghat where you will have dinner and rest.', metrics: ['🚌 Tempo Traveller', '⏱️ 9-10 hours'] },
        { day: 2, title: 'Govindghat to Pulna & Trek to Ghangharia', desc: 'After breakfast, we drive to Pulna. From there, we start our trek towards Ghangharia via Pulna village. On the way, enjoy beautiful mountain views. Reach Ghangharia in the evening for dinner.', metrics: ['🥾 9 km trek', '🏔️ Elev: 9,800 ft'] },
        { day: 3, title: 'Trek to Valley of Flowers & Back', desc: 'Explore the beautiful valley and see stunning views of the colourful exotic flowers. After spending time in the valley, we trek back to Ghangaria. Don\'t forget to capture the moments.', metrics: ['🥾 10 km trek', '🏔️ Elev: 11,500 ft'] },
        { day: 4, title: 'Trek to Hemkund Sahib & Back', desc: 'Trek to Hemkund Sahib, a sacred Sikh shrine surrounded by seven snow-capped peaks. Take a dip in the holy lake and visit the Gurudwara. Return to Ghangaria.', metrics: ['🥾 12 km trek', '🏔️ Elev: 15,200 ft'] },
        { day: 5, title: 'Trek down to Pulna & Drive to Badrinath', desc: 'Trek down to Pulna village and drive to the sacred Badrinath temple. After Darshan, drive to Joshimath/Govindghat for the night.', metrics: ['🚌 2 hrs drive'] },
        { day: 6, title: 'Drive back to Rishikesh', desc: 'After breakfast, drive back to Rishikesh. The expedition concludes upon reaching Rishikesh.', metrics: ['🚌 9 hours drive'] }
    ]),
    inclusions: ['Premium Accommodation', 'All Meals', 'Expert Guides', 'Permits & Fees', 'Transportation'],
    exclusions: ['Flights', 'Personal Expenses', 'Travel Insurance', 'Porters'],
    cancellation_policy: ['> 30 days prior: 50% of cost charged', '15–30 days prior: 75% of cost charged', '0–15 days prior: 100% of cost charged'],
    terms_and_conditions: ['Booking Confirmation: Confirmed upon receipt of deposit.', 'Force Majeure: Not liable for changes caused by natural disasters.', 'Medical Emergencies: Evacuation costs borne by client.'],
    health_and_fitness: ['Physical Condition: Requires excellent cardiovascular fitness.', 'Altitude Risks: Trekking involves inherent risks of AMS.'],
    travel_insurance: ['Medical coverage', 'Personal accident coverage', 'Helicopter rescue services'],
    important_notes: ['Changes: Route may change due to weather or safety.'],
    risk_liabilities: ['Inherent Risks: High-altitude trekking involves unpredictable weather.', 'Liability Release: Must sign assumption of risk.'],
    things_to_remember: ['Acclimatization: Walk slowly to prevent altitude sickness.', 'Leave No Trace: Carry reusable water bottle.'],
    things_to_carry: JSON.stringify([
        { category: 'Basic Gears', items: ['Backpack', 'Water Bottle', 'Trekking Poles', 'Headlamp'] },
        { category: 'Clothing', items: ['Trekking Pants', 'Fleece Jacket', 'Down Jacket', 'Thermal Innerwear'] }
    ])
};

const annapurna = {
    title: 'Annapurna Circuit',
    subtitle: 'The Ultimate Himalayan Trek',
    duration: '14 DAYS',
    difficulty: 'CHALLENGING',
    cost: '76500',
    cover_image_url: '/images/annapurna.webp',
    highlights: ['Thorong La Pass', 'Tilicho Lake', 'Diverse Landscapes', 'Luxury Teahouses'],
    itinerary: JSON.stringify([
        { day: 1, title: 'Arrival in Kathmandu', desc: 'Arrive in Kathmandu. Briefing and preparation.', metrics: ['🏔️ Elev: 1,400m'] },
        { day: 2, title: 'Drive to Besisahar & Chame', desc: 'Long scenic drive to the starting point of the trek.', metrics: ['🚌 8 hours'] },
        { day: 3, title: 'Trek to Upper Pisang', desc: 'Begin trekking through beautiful pine forests.', metrics: ['🥾 6 hours'] },
        { day: 4, title: 'Trek to Manang', desc: 'Acclimatization and stunning views of Annapurna II.', metrics: ['🥾 7 hours'] },
        { day: 5, title: 'Acclimatization in Manang', desc: 'Rest day to adjust to altitude.', metrics: ['🏔️ Elev: 3,540m'] },
        { day: 6, title: 'Trek to Yak Kharka', desc: 'Shorter trek ascending gradually.', metrics: ['🥾 4 hours'] },
        { day: 7, title: 'Trek to Thorong Phedi', desc: 'Reaching the base of the pass.', metrics: ['🥾 4 hours'] },
        { day: 8, title: 'Cross Thorong La Pass to Muktinath', desc: 'The most challenging day, crossing the 5,416m pass.', metrics: ['🥾 9 hours', '🏔️ Elev: 5,416m'] },
        { day: 9, title: 'Trek to Jomsom', desc: 'Descend into the arid Mustang region.', metrics: ['🥾 5 hours'] },
        { day: 10, title: 'Fly/Drive to Pokhara', desc: 'Return to civilization in beautiful Pokhara.', metrics: ['✈️ 25 mins'] }
    ]),
    inclusions: ['Premium Teahouse Stays', 'All Meals', 'Expert Guides', 'Permits & Fees', 'Domestic Flights'],
    exclusions: ['International Flights', 'Personal Expenses', 'Travel Insurance', 'Porters for personal gear'],
    cancellation_policy: ['> 30 days prior: 50% of cost charged', '15–30 days prior: 75% of cost charged', '0–15 days prior: 100% of cost charged'],
    terms_and_conditions: ['Booking Confirmation: Confirmed upon receipt of deposit.', 'Force Majeure: Not liable for changes caused by natural disasters.', 'Medical Emergencies: Evacuation costs borne by client.'],
    health_and_fitness: ['Physical Condition: Requires excellent cardiovascular fitness.', 'Altitude Risks: Trekking involves inherent risks of AMS.'],
    travel_insurance: ['Medical coverage', 'Personal accident coverage', 'Helicopter rescue services'],
    important_notes: ['Changes: Route may change due to weather or safety.'],
    risk_liabilities: ['Inherent Risks: High-altitude trekking involves unpredictable weather.', 'Liability Release: Must sign assumption of risk.'],
    things_to_remember: ['Acclimatization: Walk slowly to prevent altitude sickness.', 'Leave No Trace: Carry reusable water bottle.'],
    things_to_carry: JSON.stringify([
        { category: 'Basic Gears', items: ['Backpack', 'Water Bottle', 'Trekking Poles', 'Headlamp'] },
        { category: 'Clothing', items: ['Trekking Pants', 'Fleece Jacket', 'Down Jacket', 'Thermal Innerwear'] }
    ])
};

async function seed() {
    console.log('Inserting Valley of Flowers...');
    let res = await supabase.from('trips').insert([valleyOfFlowers]);
    if (res.error) {
        console.error('Error inserting Valley of Flowers:', res.error.message);
        return;
    }
    console.log('Inserting Annapurna Circuit...');
    res = await supabase.from('trips').insert([annapurna]);
    if (res.error) {
        console.error('Error inserting Annapurna:', res.error.message);
        return;
    }
    console.log('Successfully inserted both trips!');
}

seed();
