import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',timeout:60000,fullyParallel:true,workers:2,
 use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:3000',viewport:{width:390,height:844},trace:'retain-on-failure',launchOptions:process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}},
 webServer:{command:'npm run start -- --hostname 127.0.0.1 --port 3000',url:'http://127.0.0.1:3000/vi',reuseExistingServer:!process.env.CI},
 reporter:'list',
});
