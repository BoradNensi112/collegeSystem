const express = require('express');
const Timetable = require('../controller/timetable');
const router = express.Router();

router.post('/Tadd', Timetable.postTimetableAdd);
router.post('/Tdelete', Timetable.postTimetableDel);
router.post('/Tedit', Timetable.postTimetableEdit);
router.post('/Tupdate', Timetable.postTimetableUp);
router.get('/list', Timetable.postTimetableData);
router.post('/list', Timetable.postTimetableData);
router.post('/postTimetableData', Timetable.postTimetableData);
router.post('/postOneData', Timetable.postOneData);
router.post('/delete', Timetable.postDelete);
router.post('/update', Timetable.postUpdate);

module.exports = router;