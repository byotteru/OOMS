const { app } = require("electron");
const preloadAssert = require("assert");

describe("プリロードスクリプトの機能", () => {
  it("should load the app correctly", () => {
    preloadAssert.strictEqual(app.isReady(), true);
  });
});
