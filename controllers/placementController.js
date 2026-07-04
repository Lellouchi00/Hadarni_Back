const placementService = require("../services/placementService");

async function getExam(req, res, next) {
  try {
    const { level, section } = req.params;
    const exam = await placementService.deliverExam(level, section);
    res.json(exam);
  } catch (err) {
    next(err);
  }
}

async function submitSection(req, res, next) {
  try {
    const { level, section } = req.params;
    const result = await placementService.submitSection(level, section, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getExam,
  submitSection,
};
