"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthData = generateLast12MonthData;
async function generateLast12MonthData(model) {
    const last12Months = [];
    const currentData = new Date();
    currentData.setDate(currentData.getDate() + 1);
    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(currentData.getFullYear(), currentData.getMonth(), currentData.getDate() - i * 28);
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);
        const monthYear = endDate.toLocaleString("default", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        const count = await model.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } });
        last12Months.push({ month: monthYear, count });
    }
    return { last12Months };
}
