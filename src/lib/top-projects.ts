import { MAIN_QUEST_WINNERS } from "@/app/results/data";

// Projects tagged "top project" across the site - the /projects badge and filter, and the results
// page's "view top projects" button. The list is the "T shirt" view of the projects table in the
// Chodhyam results base (ids there are the same as the Hub's projects.id), plus every main quest
// winner so a winner can never miss the badge.
// 156 projects, collected on 2026-10-18.
const T_SHIRT_VIEW_IDS = [
  8081, 8133, 8162, 8169, 8175, 8189, 8203, 8222, 8233, 8236, 8261, 8272, 8274, 8304, 8308, 8318, 8323, 8332, 8333,
  8339, 8340, 8350, 8379, 8399, 8404, 8415, 8418, 8422, 8430, 8435, 8436, 8441, 8449, 8458, 8487, 8488, 8489, 8554,
  8555, 8577, 8578, 8627, 8748, 8771, 8774, 8804, 8808, 8832, 8833, 8870, 8906, 8914, 8920, 8927, 8942, 8949, 8968,
  9001, 9002, 9014, 9061, 9077, 9081, 9089, 9113, 9120, 9131, 9138, 9142, 9145, 9149, 9167, 9169, 9172, 9185, 9195,
  9204, 9223, 9224, 9231, 9237, 9263, 9282, 9355, 9372, 9389, 9394, 9405, 9416, 9423, 9442, 9446, 9453, 9460, 9477,
  9486, 9538, 9544, 9552, 9559, 9572, 9589, 9610, 9630, 9631, 9645, 9652, 9671, 9688, 9698, 9718, 9733, 9750, 9770,
  9785, 9797, 9798, 9799, 9801, 9820, 9834, 9845, 9846, 9848, 9853, 9866, 9879, 9888, 9915, 9928, 9960, 9969, 9974,
  9987, 9998, 10016, 10021, 10028, 10040, 10041, 10046, 10053, 10066, 10079, 10085, 10094, 10099, 10161, 10164,
  10188, 10190, 10194, 10240, 10244, 10246, 10266,
];

export const TOP_PROJECT_IDS: ReadonlySet<number> = new Set([
  ...T_SHIRT_VIEW_IDS,
  ...MAIN_QUEST_WINNERS.map((w) => w.projectId),
]);
