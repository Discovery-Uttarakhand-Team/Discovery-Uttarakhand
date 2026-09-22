import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const submissionQueue = new Queue("submissionQueue", {
    connection: redis,
});

export const aiAnalysisQueue = new Queue("aiAnalysisQueue", {
    connection: redis,
});

export const quizQueue = new Queue("quizQueue", {
    connection: redis,
});

export const reportQueue = new Queue("reportQueue", {
    connection: redis,
});

export const notificationQueue = new Queue("notificationQueue", {
    connection: redis,
});

export const queues = {
    submissionQueue,
    aiAnalysisQueue,
    quizQueue,
    reportQueue,
    notificationQueue,
};