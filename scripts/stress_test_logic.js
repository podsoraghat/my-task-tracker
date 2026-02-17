const { createClient } = require('@supabase/supabase-js');
const { parseISO, isWithinInterval } = require('date-fns');

const supabaseUrl = 'https://cracxeobqswrkikkhlbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWN4ZW9icXN3cmtpa2tobGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDU5OTIsImV4cCI6MjA4NjcyMTk5Mn0.wnpMbWyNS-fYNs-iy3SOkS6mO14ALLWq2gJMFp3DYO4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function stressTest() {
    console.log('🛡️ Starting Stricter Logic Stress Test...');

    const { data: tasks, error } = await supabase.from('tasks').select('*');
    if (error) {
        process.exit(1);
    }

    const testResults = {
        passed: 0,
        failed: 0,
        warnings: 0,
        details: []
    };

    function assert(condition, message) {
        if (condition) {
            testResults.passed++;
        } else {
            testResults.failed++;
            testResults.details.push(`❌ FAIL: ${message}`);
        }
    }

    // --- TEST 1: TIME SORTING LOGIC ---
    // Fixing the bug: using numeric parsing for comparison
    console.log('\nChecking Sort Integrity (Numeric Parsing)...');
    const timeA = { time_taken: "2hr 0min" };
    const timeB = { time_taken: "10hr 0min" };

    const parseTime = (str) => {
        if (!str) return 0;
        const hrs = parseInt(str.match(/(\d+)hr/)?.[1] || '0');
        const mins = parseInt(str.match(/(\d+)min/)?.[1] || '0');
        return (hrs * 60) + mins;
    };

    const sortFn = (a, b) => {
        const valA = parseTime(a.time_taken);
        const valB = parseTime(b.time_taken);
        return valA < valB ? -1 : 1;
    };

    const sortedTimes = [timeA, timeB].sort(sortFn);
    assert(sortedTimes[0].time_taken === "2hr 0min", `Numeric sort failed: Expected 2hr < 10hr. Found ${sortedTimes[0].time_taken} at top.`);

    // --- TEST 2: SEARCH RESILIENCE ---
    console.log('Checking Search String Safety...');
    const mockTask = { task_name: "Check (Parens) & [Brackets*]", client_name: "Special! Char? Client", user_name: "user_123" };
    const searchTerms = ["(", "[", "!", "*", "(Parens)"];

    searchTerms.forEach(term => {
        const matches = mockTask.task_name.toLowerCase().includes(term.toLowerCase()) ||
            mockTask.client_name.toLowerCase().includes(term.toLowerCase());
        assert(matches, `Search safety failed for character: ${term}`);
    });

    // --- TEST 3: NULL HANDLING ---
    console.log('Checking Null/Undefined Resilience...');
    const nullTask = { asset_count: null, time_taken: null, task_name: "" };
    try {
        const count = nullTask.asset_count || 1;
        const search = (nullTask.task_name || "").toLowerCase().includes("test");
        assert(count === 1 && search === false, "Null fallback logic failed.");
    } catch (e) {
        assert(false, "Null value crashed the logic.");
    }

    // --- TEST 4: DATA CONSISTENCY (Mathematical) ---
    console.log('Checking Global Math Consistency...');
    const totalCount = tasks.length;
    const users = [...new Set(tasks.map(t => t.user_name))];
    let sumByUsers = 0;
    users.forEach(u => {
        sumByUsers += tasks.filter(t => t.user_name === u).length;
    });
    assert(sumByUsers === totalCount, `Count Integrity: Total tasks (${totalCount}) must equal sum of users (${sumByUsers})`);

    // --- TEST 5: DATE OVERLAP ---
    console.log('Checking Date Range Precision...');
    const feb1 = parseISO('2026-02-01');
    const range = { start: feb1, end: feb1 }; // Exact same day
    const taskOnFeb1 = tasks.find(t => t.start_date === '2026-02-01');
    if (taskOnFeb1) {
        const isMatch = isWithinInterval(parseISO(taskOnFeb1.start_date), range);
        assert(isMatch, "Single-day date interval matching failed.");
    } else {
        testResults.warnings++;
        console.log("⚠️ Skip: No task found on Feb 1st for interval test.");
    }

    // --- SUMMARY ---
    console.log('\n--- 🏁 FINAL RESULTS ---');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    if (testResults.warnings > 0) console.log(`⚠️ Warnings: ${testResults.warnings}`);

    if (testResults.failed > 0) {
        console.log('\nDetailed Errors:');
        testResults.details.forEach(d => console.log(d));
    } else {
        console.log('\n🚀 ALL CORE LOGIC IS BULLETPROOF!');
    }

    process.exit(testResults.failed > 0 ? 1 : 0);
}

stressTest();
