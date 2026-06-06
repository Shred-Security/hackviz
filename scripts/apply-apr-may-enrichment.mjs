import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hacksPath = path.join(__dirname, "../artifacts/web3hackviz/src/data/hacks.ts");
const enrichmentPath = path.join(__dirname, "apr-may-2026-enrichment.json");

const { hacks } = await import("../artifacts/web3hackviz/src/data/hacks.ts");
const enrichment = JSON.parse(fs.readFileSync(enrichmentPath, "utf8"));

function escapeTsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatQuiz(quiz) {
  const items = quiz.map((q) => {
    const options = q.options.map((o) => `"${escapeTsString(o)}"`).join(", ");
    return `      {
        question: "${escapeTsString(q.question)}",
        options: [${options}],
        correct: ${q.correct},
        explanation: "${escapeTsString(q.explanation)}",
      }`;
  });
  return `    quiz: [\n${items.join(",\n")},\n    ]`;
}

let content = fs.readFileSync(hacksPath, "utf8");
let applied = 0;

for (const [id, data] of Object.entries(enrichment)) {
  const hack = hacks.find((h) => h.id === id);
  if (!hack) {
    console.error("Hack not found:", id);
    process.exit(1);
  }

  const idIdx = content.indexOf(`id: "${id}"`);
  if (idIdx === -1) {
    console.error("ID not in file:", id);
    process.exit(1);
  }

  const nextHackIdx = content.indexOf("\n  // ", idIdx + 1);
  const blockEnd = nextHackIdx === -1 ? content.length : nextHackIdx;
  let block = content.slice(idIdx, blockEnd);

  const oldTech = hack.technicalDesc;
  const newTech = data.technicalDesc;
  const escapedOld = escapeTsString(oldTech).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const techPattern = new RegExp(`technicalDesc:\\s*"${escapedOld}"`);
  if (!techPattern.test(block)) {
    console.error("technicalDesc pattern failed for", id);
    process.exit(1);
  }
  block = block.replace(
    techPattern,
    `technicalDesc: "${escapeTsString(newTech)}"`,
  );

  const quizPattern = /    quiz: \[[\s\S]*?\n    \]|    quiz: \[[^\n]+\]/;
  if (!quizPattern.test(block)) {
    console.error("quiz pattern failed for", id);
    process.exit(1);
  }
  block = block.replace(quizPattern, formatQuiz(data.quiz));

  content = content.slice(0, idIdx) + block + content.slice(blockEnd);
  applied++;
  console.log("Applied", id);
}

fs.writeFileSync(hacksPath, content);
console.log("Done:", applied, "hacks updated");
