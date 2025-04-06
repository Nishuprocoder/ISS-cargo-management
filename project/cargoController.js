const express = require('express');
const multer = require('multer'); // Add multer here
const router = express.Router();
const cargoService = require('./cargoService');

const upload = multer({ storage: multer.memoryStorage() }); // Define multer here

class CargoController {
    async importItems(req, res) {
        try {
            const data = await cargoService.importItems(req.file);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async importContainers(req, res) {
        try {
            const data = await cargoService.importContainers(req.file);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async placeItems(req, res) {
        try {
            const data = await cargoService.placeItems(req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async searchItem(req, res) {
        try {
            const data = await cargoService.searchItem(req.query.itemId);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async retrieveItem(req, res) {
        try {
            const data = await cargoService.retrieveItem(req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async identifyWaste(req, res) {
        try {
            const data = await cargoService.identifyWaste();
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async planWasteReturn(req, res) {
        try {
            const data = await cargoService.planWasteReturn(req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async simulateDay(req, res) {
        try {
            const data = await cargoService.simulateDay(req.body);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getLogs(req, res) {
        try {
            const data = await cargoService.getLogs(req.query);
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

const controller = new CargoController();

// Define routes with multer for file uploads
router.post('/api/import/items', upload.single('file'), controller.importItems.bind(controller));
router.post('/api/import/containers', upload.single('file'), controller.importContainers.bind(controller));
router.post('/api/placement', controller.placeItems.bind(controller));
router.get('/api/search', controller.searchItem.bind(controller));
router.post('/api/retrieve', controller.retrieveItem.bind(controller));
router.get('/api/waste/identify', controller.identifyWaste.bind(controller));
router.post('/api/waste/return-plan', controller.planWasteReturn.bind(controller));
router.post('/api/simulate/day', controller.simulateDay.bind(controller));
router.get('/api/logs', controller.getLogs.bind(controller));

module.exports = router;