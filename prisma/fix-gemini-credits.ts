import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const updates = [
    { name: "Gemini Trial", credits: 10000 },
    { name: "Gemini Mini", credits: 32000 },
    { name: "Gemini Plus", credits: 110000 },
    { name: "Gemini Pro", credits: 198000 },
    { name: "Gemini Max", credits: 550000 },
    { name: "Gemini Ultra", credits: 1650000 },

    { name: "Gemini Plus 3M", credits: 313000 },
    { name: "Gemini Plus 6M", credits: 594000 },
    { name: "Gemini Plus Year", credits: 1120000 },

    { name: "Gemini Pro 3M", credits: 643000 },
    { name: "Gemini Pro 6M", credits: 1220000 },
    { name: "Gemini Pro Year", credits: 2330000 },

    { name: "Gemini Max 6M", credits: 1550000 },
    { name: "Gemini Max Year", credits: 2880000 },

    { name: "Gemini Ultra Year", credits: 3880000 },
];

async function main() {
    console.log("Fixing Gemini credits...");

    for (const item of updates) {
        const result = await prisma.product.updateMany({
            where: {
                name: item.name,
                apiFamily: "GEMINI",
            },
            data: {
                credits: item.credits,
            },
        });

        console.log(
            `${result.count > 0 ? "✅" : "⚠️"} ${item.name} -> ${item.credits} credits | updated: ${result.count}`,
        );
    }

    console.log("Done.");
}

main()
    .catch((error) => {
        console.error("Fix Gemini credits failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
