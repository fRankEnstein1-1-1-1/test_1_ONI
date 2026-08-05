// =====================================================
// GYM WORKOUT SCHEDULER (BACKTRACKING + PRIORITY SCORING)
// PART 1
// =====================================================

// ---------------------- INPUT -------------------------

const muscleGroups = [
    "Chest",
    "Back",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Legs",
    "Abs"
];

const previousWeek = {

    Monday:["Chest","Back"],

    Tuesday:["Legs","Shoulders"],

    Wednesday:["Chest","Abs"],

    Thursday:["Back","Biceps"],

    Friday:["Legs","Triceps"],

    Saturday:["Chest","Shoulders"]

};

const previousWeekSINGLE = {
    Monday: ["Chest"],
    Tuesday: ["Back"],
    Wednesday: ["Shoulders"],
    Thursday: ["Biceps"],
    Friday: ["Triceps"],
    Saturday: ["Legs"],
    Sunday: ["Abs"]
};

const priorities = {
    Chest: 7,
    Back: 6,
    Shoulders: 5,
    Biceps: 4,
    Triceps: 3,
    Legs: 2,
    Abs: 1
};

const workoutDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const dayOffs = ["Sunday","Monday"];

const musclesPerDay = 1;

const recoveryGap = 1;

// Maximum valid schedules to evaluate.
// Prevents searching forever.

const LIMIT = 1000;


// ---------------------- GLOBALS -------------------------

let bestSchedule = [];
let bestScore = -1;

let validSchedules = 0;


// ---------------------- HELPERS -------------------------

function deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}


// Generate nCr combinations

function generateCombinations(groups,size){

    const result=[];

    function helper(start,current){

        if(current.length===size){
            result.push([...current]);
            return;
        }

        for(let i=start;i<groups.length;i++){

            current.push(groups[i]);

            helper(i+1,current);

            current.pop();

        }

    }

    helper(0,[]);

    return result;

}

const combinations =
generateCombinations(
    muscleGroups,
    musclesPerDay
);


// Randomize order

combinations.sort(()=>Math.random()-0.5);


// ---------------------- VALIDATION -------------------------

function isValid(combo,schedule,dayName){

    // Recovery

    const recent = schedule
        .filter(day=>!day.leave)
        .slice(-recoveryGap);

    for(const day of recent){

        for(const muscle of combo){

            if(day.combo.includes(muscle))
                return false;

        }

    }

    // Duplicate combination

    const current =
        [...combo]
        .sort()
        .join(",");

    for(const day of schedule){

        if(day.leave)
            continue;

        const old =
            [...day.combo]
            .sort()
            .join(",");

        if(old===current)
            return false;

    }

    if(previousWeek[dayName]){

    const current =
        [...combo]
        .sort()
        .join(",");

    const previous =
        [...previousWeek[dayName]]
        .sort()
        .join(",");

    if(current===previous){
          console.log(
            `Rejected ${dayName}: ${current} (same as previous week)`
        );
        return false;
    }
}

    return true;

}



// ---------------------- SCORE -------------------------

function calculateScore(schedule){

    const count={};

    for(const muscle of muscleGroups)
        count[muscle]=0;


    for(const day of schedule){

        if(day.leave)
            continue;

        for(const muscle of day.combo){

            count[muscle]++;

        }

    }

    let score=0;

    for(const muscle of muscleGroups){

        score +=
            count[muscle] *
            priorities[muscle];

    }

    return score;

}
// =====================================================
// PART 2
// =====================================================


// ---------------------- BACKTRACKING -------------------------

// FOR SINGLE MUSCLE
function solveSingle(schedule) {

    // Copy all muscles
    const availableMuscles = [...muscleGroups];

    // Shuffle so every execution is different
    availableMuscles.sort(() => Math.random() - 0.5);

    for (const day of workoutDays) {

        // Leave day
        if (dayOffs.includes(day)) {

            schedule.push({
                day,
                leave: true
            });

            continue;
        }

        let assigned = false;

        // Try every remaining muscle
        for (let i = 0; i < availableMuscles.length; i++) {

            const muscle = availableMuscles[i];

            // Check previous week's same weekday
            if (previousWeekSINGLE[day]) {

                if (previousWeekSINGLE[day][0] === muscle)
                    continue;

            }

            // Assign
            schedule.push({
                day,
                combo: [muscle],
                leave: false
            });

            // Remove so it never appears again this week
            availableMuscles.splice(i, 1);

            assigned = true;
            break;
        }

        if (!assigned) {

            console.log(`No valid muscle available for ${day}`);
            return false;

        }

    }

    bestSchedule = deepCopy(schedule);
    bestScore = 0;

    return true;
}


// FOR DOUBLE MUSCLE 
function solve(dayIndex, schedule) {

    // Stop if we've already explored enough schedules
    if (validSchedules >= LIMIT)
        return;

    // Completed one full week
    if (dayIndex === workoutDays.length) {

        validSchedules++;

        const score = calculateScore(schedule);

        if (score > bestScore) {

            bestScore = score;
            bestSchedule = deepCopy(schedule);

        }

        return;
    }

    const today = workoutDays[dayIndex];

    // Leave Day

    if (dayOffs.includes(today)) {

        schedule.push({
            day: today,
            leave: true
        });

        solve(dayIndex + 1, schedule);

        schedule.pop();

        return;
    }

    // Try every combination

    for (const combo of combinations) {

        if (!isValid(combo, schedule))
            continue;

        schedule.push({
            day: today,
            combo,
            leave: false
        });

        solve(dayIndex + 1, schedule);

        // Backtrack
        schedule.pop();

    }

}



// ---------------------- RUN -------------------------

const schedule = [];

if (musclesPerDay === 1) {

   solveSingle(schedule);

} else {

    solve(0, schedule);

}


// ---------------------- OUTPUT -------------------------

console.log("\n====================================");
console.log("BEST WORKOUT SCHEDULE");
console.log("====================================\n");

bestSchedule.forEach(day => {

    if (day.leave) {

        console.log(`${day.day} : LEAVE`);

    } else {

        console.log(
            `${day.day} : ${day.combo.join(" + ")}`
        );

    }

});

console.log("\n====================================");
console.log("STATISTICS");
console.log("====================================");

console.log("\nScore :", bestScore);
console.log("Schedules Evaluated :", validSchedules);


// Count appearances

const count = {};

for (const muscle of muscleGroups)
    count[muscle] = 0;

for (const day of bestSchedule) {

    if (day.leave)
        continue;

    for (const muscle of day.combo)
        count[muscle]++;

}

console.log("\nAppearances\n");

const sorted = [...muscleGroups].sort(
    (a, b) => priorities[b] - priorities[a]
);

for (const muscle of sorted) {

    console.log(
        `${muscle.padEnd(12)} | Priority : ${priorities[muscle]} | Appeared : ${count[muscle]}`
    );

}

console.log("\n====================================");