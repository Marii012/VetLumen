const express = require('express');
const router = express.Router();

const medicalRecordController = require('../controllers/medicalRecordController');


router.get('/', medicalRecordController.getAllMedicalRecords);

router.get('/pet/:id', medicalRecordController.getMedicalRecordsByPet);

router.get('/:id', medicalRecordController.getMedicalRecordById);

router.post('/', medicalRecordController.createMedicalRecord);

router.put('/:id', medicalRecordController.updateMedicalRecord);

router.delete('/:id', medicalRecordController.deleteMedicalRecord);


module.exports = router;