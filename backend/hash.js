const bcrypt = require("bcrypt");

(async () => {
    const hash = await bcrypt.hash("test123", 10);
    console.log(hash);
})();
