const express = require('express');
const Communication = require('../controller/communication');
const communication = require('../models/communication');
const router = express.Router();

router.post('/Cadd', Communication.postCommAdd);
router.post('/Cdelete', Communication.postCommDel);
router.post('/Cedit', Communication.postCommEdit);
router.post('/Cupdate', Communication.postCommUp);
router.post('/postCommuData', Communication.postCommuData);
router.post('/postOneData', Communication.postOneData);
router.post('/delete', Communication.postDelete);
router.post('/update', Communication.postUpdate);

module.exports = router;