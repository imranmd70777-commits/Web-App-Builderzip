import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import subjectsRouter from "./subjects";
import chaptersRouter from "./chapters";
import mcqsRouter from "./mcqs";
import bookmarksRouter from "./bookmarks";
import wrongAnswersRouter from "./wrong-answers";
import examsRouter from "./exams";
import resultsRouter from "./results";
import statsRouter from "./stats";
import adminRouter from "./admin";
import usersRouter from "./users";
import importRouter from "./import";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(subjectsRouter);
router.use(chaptersRouter);
router.use(importRouter);
router.use(mcqsRouter);
router.use(bookmarksRouter);
router.use(wrongAnswersRouter);
router.use(examsRouter);
router.use(resultsRouter);
router.use(statsRouter);
router.use(adminRouter);
router.use(usersRouter);

export default router;
