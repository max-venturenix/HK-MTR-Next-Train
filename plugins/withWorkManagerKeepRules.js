const {withDangerousMod} = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");

// Room 2.6.1 instantiates WorkManager's generated database through reflection.
const keepRule = "-keep class androidx.work.impl.WorkDatabase_Impl { public <init>(); }";

module.exports = config => withDangerousMod(config, ["android", async config => {
    const file = path.join(config.modRequest.platformProjectRoot, "app", "proguard-rules.pro");
    const contents = await fs.readFile(file, "utf8");
    if (!contents.includes(keepRule)) {
        await fs.writeFile(file, `${contents}\n# Preserve WorkManager's reflective Room constructor.\n${keepRule}\n`);
    }
    return config;
}]);
