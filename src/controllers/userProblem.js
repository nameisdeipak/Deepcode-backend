const {
  getLanguageById,
  submitBatch,
  submitToken,
} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  console.log(req.body);

  try {
    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language);

console.log("Language:", language, "→ ID:", languageId);

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      // const resultToken = submitResult.map((value) => value.token);
      const resultToken = submitResult
        .filter((value) => value && value.token) // 💡 add this check
        .map((value) => value.token);

      // console.Iog(resultToken);
      const testResult = await submitToken(resultToken);
      console.log(testResult)

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).send("Error Occured");
        }
      }
    }

    // we can stroe in our DB

    const userProblem = await Problem.create({
      ...req.body,
      problemCreator: req.result._id,
    });

    res.status(201).send("Problem Saved Successfully");
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;

  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  try {
    if (!id) {
      return res.status(400).send("Missing ID Field");
    }

    const DsaProblem = await Problem.findById(id);
    if (!DsaProblem) {
      return res.status(400).send("ID is not present in server");
    }

    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language);

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value) => value.token);
      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

      const testResult = await submitToken(resultToken);
      // console.Iog(testResult);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).send("Error Occured");
        }
      }
    }

    const newProblem = await Problem.findByIdAndUpdate(
      id,
      { ...req.body },
      { runValidators: true, new: true }
    );

    res.status(200).send(newProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).send(" ID is Missing");
    }

    const deletedProblem = await Problem.findByIdAndDelete(id);

    if (!deletedProblem) return res.status(400).send("Problem is Missing");

    res.status(200).send("Successfully Deleted");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;
  const userId = req.result._id;
  try {
    if (!id) return res.status(400).send("ID is Missing");

    const selection =
      req.result.role == "admin"
        ? "_id title description difficulty tags visibleTestCases hiddenTestCases startCode referenceSolution "
        : "_id title description difficulty tags visibleTestCases  startCode referenceSolution ";

    const getProblem = await Problem.findById(id).select(selection).lean();

    if (!getProblem) return res.status(404).send("Problem is Missing");

    const videos = await SolutionVideo.findOne({
      problemId: id,
      userId: userId,
    });

    if (videos) {
      getProblem.secureUrl = videos.secureUrl;
      getProblem.cloudinaryPublicId = videos.cloudinaryPublicId;
      getProblem.thumbnailUrl = videos.thumbnailUrl;
      getProblem.duration = videos.duration;

      return res.status(200).send(getProblem);
    }

    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getAllProblem = async (req, res) => {
  try {
    const getProblem = await Problem.find({}).select(
      "_id title difficulty tags"
    );

    if (getProblem.length == 0)
      return res.status(400).send("Problem is Missing");

    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const solvedAllProblembyUser = async (req, res) => {
  try {
    const userId = req.result._id;

    const user = await User.findById(userId).populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
    });

    const solvedProblems = await Submission.aggregate([
      {
        $match: {
          userId: userId,
          status: "accepted",
        },
      },

      {
        $group: {
          _id: "$problemId",
        },
      },

      {
        $lookup: {
          from: "problems",
          localField: "_id",
          foreignField: "_id",
          as: "problem",
        },
      },
      // Unwind the problem array
      {
        $unwind: "$problem",
      },
      // Project only the fields you need
      {
        $project: {
          _id: "$problem._id",
          title: "$problem.title",
          difficulty: "$problem.difficulty",
          tags: "$problem.tags",
        },
      },
    ]);

    // res.status(200).send(user.problemSolved,solvedProblems);
    res.status(200).send(solvedProblems);
  } catch (err) {
    res.status(500).send("Server Error: " + err);
  }
};

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;
    const ans = await Submission.find({ userId, problemId });

    if (ans.length === 0)
      return res.status(200).send("No Submission is persent"); // Add return here

    return res.status(200).send(ans); // Also good practice to return here
  } catch (err) {
    return res.status(500).send("Internal Server Error"); // And here
  }
};

const distinctProblem = async (req, res) => {
  try {
    // await Problem.aggregate()
    const result = await Problem.aggregate([
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $project: { tags: "$_id", count: 1, _id: 0 } },
    ]);

    res.status(201).json({
      problems: result,
      //   message: "",
    });
  } catch (err) {
    console.error("Error :", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to Fetch Problems Count's" });
  }
};

const getTagsProblem = async (req, res) => {
  const { tags } = req.params;

  try {
    const getProblem = await Problem.find({ tags: tags }).select(
      "_id title difficulty tags"
    );

    if (getProblem.length == 0)
      return res.status(400).send("Problem is Missing");

    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
  distinctProblem,
  getTagsProblem,
};
