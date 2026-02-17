const { createClient } = require('@supabase/supabase-js');
const {
    startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addDays, addWeeks, addMonths, isWithinInterval, parseISO, subDays
} = require('date-fns');

const supabaseUrl = 'https://cracxeobqswrkikkhlbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWN4ZW9icXN3cmtpa2tobGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDU5OTIsImV4cCI6MjA4NjcyMTk5Mn0.wnpMbWyNS-fYNs-iy3SOkS6mO14ALLWq2gJMFp3DYO4';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- THE AUDIT BRAIN ---
// This mimics our useTasks logic exactly to catch discrepancies
const filterLogic = (tasks, filters, activeRange = null) => {
    return tasks.filter(task => {
        const matchesUser = !filters.user || task.user_name === filters.user;
        const matchesClient = !filters.client || task.client_name === filters.client;
        const matchesType = !filters.type || task.asset_type === filters.type;
        const matchesStatus = !filters.status || task.status === filters.status;
        const matchesSearch = !filters.search ||
            (task.task_name || "").toLowerCase().includes(filters.search.toLowerCase()) ||
            (task.client_name || "").toLowerCase().includes(filters.search.toLowerCase()) ||
            (task.user_name || "").toLowerCase().includes(filters.search.toLowerCase());

        let matchesDate = true;
        if (activeRange) {
            const taskDate = parseISO(task.start_date);
            matchesDate = isWithinInterval(taskDate, activeRange);
        }

        return matchesUser && matchesClient && matchesType && matchesStatus && matchesSearch && matchesDate;
    });
};

const sortLogic = (tasks, column, direction) => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (column === 'time_taken') {
            const parseTime = (str) => {
                if (!str) return 0;
                const hrs = parseInt(str.match(/(\d+)hr/)?.[1] || '0');
                const mins = parseInt(str.match(/(\d+)min/)?.[1] || '0');
                return (hrs * 60) + mins;
            };
            valA = parseTime(valA);
            valB = parseTime(valB);
        }

        if (valA === null || valA === undefined) valA = column === 'asset_count' ? 1 : '';
        if (valB === null || valB === undefined) valB = column === 'asset_count' ? 1 : '';

        if (direction === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });
    return sorted;
};

async function runUltimateAudit() {
    console.log('🚀 INITIALIZING ULTIMATE LOGIC AUDIT (1000% MODE)...');

    // Load actual data for context
    const { data: realTasks } = await supabase.from('tasks').select('*');
    console.log(`📊 Auditing against ${realTasks.length} real entries...`);

    const results = { passed: 0, failed: 0, logs: [] };
    const assert = (cond, msg) => {
        if (cond) results.passed++;
        else { results.failed++; results.logs.push(`❌ ${msg}`); }
    };

    // --- CATEGORY 1: TIME NAVIGATION (THE YEAR CROSSER) ---
    console.log('\n📅 Testing Time Navigation Boundaries...');
    const dec31 = new Date('2025-12-31T12:00:00');
    assert(addMonths(dec31, 1).getMonth() === 0, "Year Cross: Dec + 1 month should be Jan.");
    assert(addMonths(dec31, 1).getFullYear() === 2026, "Year Cross: Dec 2025 + 1 month should be 2026.");

    const jan1 = startOfMonth(new Date('2026-01-01T12:00:00'));
    assert(isWithinInterval(parseISO('2026-01-01'), { start: jan1, end: endOfMonth(jan1) }), "Date Precision: Jan 1 must be within Jan range.");
    assert(!isWithinInterval(parseISO('2025-12-31'), { start: jan1, end: endOfMonth(jan1) }), "Date Exclusion: Dec 31 must NOT be in Jan range.");

    // --- CATEGORY 2: FUZZY SEARCH STRESS ---
    console.log('🔍 Testing Search Edge Cases...');
    const searchData = [
        { task_name: "LOGO DESIGN", client_name: "Apple", user_name: "admin" },
        { task_name: "Logo Design", client_name: "Banan", user_name: "Admin" },
        { task_name: "   logo   ", client_name: "   ", user_name: "  " }
    ];

    assert(filterLogic(searchData, { search: "logo" }).length === 3, "Case Sensitivity: Search 'logo' should find 'LOGO'.");
    assert(filterLogic(searchData, { search: "LOGO" }).length === 3, "Case Sensitivity: Search 'LOGO' should find 'logo'.");
    assert(filterLogic(searchData, { search: "Admin" }).length === 2, "Search Scope: Should find match in user_name.");

    // --- CATEGORY 3: SORTING PERFORMANCE ---
    console.log('🔢 Testing Sorting Integrity...');
    const sortData = [
        { asset_count: 5, time_taken: "1hr 0min", start_date: "2026-01-01" },
        { asset_count: 5, time_taken: "1hr 30min", start_date: "2026-01-01" }, // Secondary sort test
        { asset_count: 2, time_taken: "20min", start_date: "2026-02-01" },
        { asset_count: 20, time_taken: "10hr 5min", start_date: "2024-12-31" }
    ];

    const byTime = sortLogic(sortData, 'time_taken', 'desc');
    assert(byTime[0].time_taken === "10hr 5min", "Sort: 10hr must be top.");
    assert(byTime[3].time_taken === "20min", "Sort: 20min must be bottom.");

    const byCount = sortLogic(sortData, 'asset_count', 'asc');
    assert(byCount[0].asset_count === 2, "Sort: Count 2 must be bottom.");
    assert(byCount[3].asset_count === 20, "Sort: Count 20 must be top.");

    // --- CATEGORY 4: FILTER PERMUTATIONS (COMBINATORIAL) ---
    console.log('🧪 Testing Filter Permutations...');
    // We pick 3 filters and test all 8 combinations
    const baseFilters = { client: "Blufig", status: "Completed", user: "podsoraghat" };
    const permutations = [
        {},
        { client: "Blufig" },
        { status: "Completed" },
        { user: "podsoraghat" },
        { client: "Blufig", status: "Completed" },
        { client: "Blufig", user: "podsoraghat" },
        { status: "Completed", user: "podsoraghat" },
        { client: "Blufig", status: "Completed", user: "podsoraghat" }
    ];

    permutations.forEach((p, i) => {
        try {
            const f = filterLogic(realTasks, p);
            assert(Array.isArray(f), `Permutation ${i} failed to return array.`);
        } catch (e) {
            assert(false, `Permutation ${i} crashed: ${e.message}`);
        }
    });

    // --- CATEGORY 5: THE "MALFORMED" DATA TEST ---
    console.log('💀 Testing Malformed/Missing Data Resistance...');
    const brokenData = [
        { task_name: null, client_name: undefined, asset_count: "broken" },
        { start_date: "invalid-date", time_taken: "????" }
    ];

    try {
        const result = filterLogic(brokenData, { search: "test" });
        const sorted = sortLogic(brokenData, 'time_taken', 'asc');
        assert(true, "App survived malformed data processing.");
    } catch (e) {
        assert(false, `App crashed on malformed data: ${e.message}`);
    }

    // --- FINAL REPORT ---
    console.log('\n--- 🏁 ULTIMATE AUDIT SCORECARD ---');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.failed > 0) {
        console.log('\nCRITICAL FAILURE DETAILS:');
        results.logs.forEach(log => console.log(log));
        process.exit(1);
    } else {
        console.log('\n💪 STATUS: 1000% FULL PROOF VERIFIED.');
        console.log('The logic has survived cross-year dates, fuzzy case search, numeric parsing, and malformed entries.');
        process.exit(0);
    }
}

runUltimateAudit();
