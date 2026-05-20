"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarehouses = exports.getUnits = exports.getCategories = exports.getTransactions = exports.stockOut = exports.stockIn = exports.deleteItem = exports.updateItem = exports.createItem = exports.getItemById = exports.getItems = void 0;
const express_1 = require("express");
const inventory_service_1 = require("../services/inventory.service");
const handleError = (res, error) => {
    console.error(error);
    if (error.message === 'item_code_exists') {
        return res.status(400).json({ success: false, message: 'د جنس کوډ مخکې شتون لري. مهرباني وکړئ بل کوډ وټاکئ.' });
    }
    if (error.message === 'not_found') {
        return res.status(404).json({ success: false, message: 'جنس ونه موندل شو.' });
    }
    if (error.message === 'invalid_quantity') {
        return res.status(400).json({ success: false, message: 'مقدار باید له صفر څخه زیات وي.' });
    }
    if (error.message === 'insufficient_stock') {
        return res.status(400).json({ success: false, message: 'په ګدام کې موجودي کمه ده.' });
    }
    return res.status(500).json({ success: false, message: 'تخنیکي ستونزه رامنځته شوه.', error: error.message });
};
const getItems = async (req, res) => {
    try {
        const items = await inventory_service_1.InventoryService.getItems(req.query);
        res.json({ success: true, data: items });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.getItems = getItems;
const getItemById = async (req, res) => {
    try {
        const item = await inventory_service_1.InventoryService.getItemById(Number(req.params.id));
        if (!item)
            return res.status(404).json({ success: false, message: 'جنس ونه موندل شو.' });
        res.json({ success: true, data: item });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.getItemById = getItemById;
const createItem = async (req, res) => {
    try {
        const { item_code, name_ps, name_fa, category_id, unit_id, warehouse_id } = req.body;
        if (!item_code || !name_ps || !name_fa || !category_id || !unit_id || !warehouse_id) {
            return res.status(400).json({ success: false, message: 'ټول اړین معلومات باید ولیکل شي.' });
        }
        const userId = 1; // Defaulting to 1 for now until auth is fully integrated
        const id = await inventory_service_1.InventoryService.createItem(req.body, userId);
        res.status(201).json({ success: true, message: 'جنس په بریالیتوب سره ثبت شو.', data: { id } });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.createItem = createItem;
const updateItem = async (req, res) => {
    try {
        const userId = 1;
        await inventory_service_1.InventoryService.updateItem(Number(req.params.id), req.body, userId);
        res.json({ success: true, message: 'د جنس معلومات په بریالیتوب سره نوي شول.' });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.updateItem = updateItem;
const deleteItem = async (req, res) => {
    try {
        const userId = 1;
        await inventory_service_1.InventoryService.deleteItem(Number(req.params.id), userId);
        res.json({ success: true, message: 'جنس په بریالیتوب سره ړنګ شو.' });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.deleteItem = deleteItem;
const stockIn = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        if (!item_id || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'د جنس ID او مقدار اړین دي.' });
        }
        const userId = 1;
        const result = await inventory_service_1.InventoryService.stockIn(req.body, userId);
        res.json({ success: true, message: 'موجودي په بریالیتوب سره زیاته شوه.', data: result });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.stockIn = stockIn;
const stockOut = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        if (!item_id || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'د جنس ID او مقدار اړین دي.' });
        }
        const userId = 1;
        const result = await inventory_service_1.InventoryService.stockOut(req.body, userId);
        res.json({ success: true, message: 'موجودي په بریالیتوب سره کمه شوه.', data: result });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.stockOut = stockOut;
const getTransactions = async (req, res) => {
    try {
        const transactions = await inventory_service_1.InventoryService.getTransactions(req.query);
        res.json({ success: true, data: transactions });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.getTransactions = getTransactions;
const getCategories = async (req, res) => {
    try {
        const categories = await inventory_service_1.InventoryService.getCategories();
        res.json({ success: true, data: categories });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.getCategories = getCategories;
const getUnits = async (req, res) => {
    try {
        const units = await inventory_service_1.InventoryService.getUnits();
        res.json({ success: true, data: units });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.getUnits = getUnits;
const getWarehouses = async (req, res) => {
    try {
        const warehouses = await inventory_service_1.InventoryService.getWarehouses();
        res.json({ success: true, data: warehouses });
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.getWarehouses = getWarehouses;
//# sourceMappingURL=inventory.controller.js.map