const { PdfReader } = require("pdfreader");

new PdfReader().parseFileItems("PRD_NCA_Website_v2.1.pdf", (err, item) => {
  if (err) console.error("error:", err);
  else if (!item) console.log("\n--- END OF FILE ---");
  else if (item.text) process.stdout.write(item.text + " ");
});
