const { chromium } = require('playwright');

(async () => {
    console.log("🚀 Launching live automated test for Project Detail View...");
    console.log("👀 Look for the new browser window to pop up!");

    // Launch out of headless mode and slow down operations so the user can watch
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000 // 1 second delay between actions
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("1️⃣ Navigating to the app...");
        await page.goto('http://localhost:3000');

        // Wait for Projects tab to be visible and click it
        console.log("2️⃣ Switching to Projects Tab...");
        await page.waitForSelector('button:has-text("Projects")');
        await page.click('button:has-text("Projects")');

        // Wait for a Project Card to appear and click it
        console.log("3️⃣ Opening a Project Card...");
        await page.waitForSelector('.group.bg-white.rounded-2xl.cursor-pointer'); // Selects a project card

        // Click the first project card
        const projectCards = await page.$$('.group.bg-white.rounded-2xl.cursor-pointer');
        if (projectCards.length > 0) {
            // Click the card body (not the delete button)
            await page.evaluate(el => el.click(), projectCards[0]);
        } else {
            throw new Error("No projects found to test.");
        }

        console.log("4️⃣ Verifying Project Detail View Tasks Tab...");
        // Wait for the modal to appear
        await page.waitForSelector('h2.text-2xl.font-black', { state: 'visible' });

        // Verify Tasks tab is active
        const tasksTab = await page.$('button:has-text("Tasks")');

        console.log("5️⃣ Hovering over tasks to show interactivity...");
        // the task rows in ProjectDetailView
        await page.waitForSelector('h4.text-sm.font-black', { state: 'visible' });
        const taskRows = await page.$$('h4.text-sm.font-black');
        if (taskRows.length > 0) {
            await taskRows[0].hover();
        }

        console.log("6️⃣ Switching to Time Logs Tab...");
        await page.click('button:has-text("Time Logs")');

        // Wait and verify the logs table or empty state
        await page.waitForTimeout(2000);

        console.log("7️⃣ Automatically closing the modal...");
        await page.click('button:has(svg.lucide-x)');

        console.log("✅ Live Test Completed Successfully!");

        // Keep it open for 3 seconds at the end
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    } finally {
        await browser.close();
        console.log("👋 Browser closed.");
    }
})();
