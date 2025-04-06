const { query, run } = require('./database');
const { placeItems } = require('./placementAlgorithm');
const { parse } = require('csv-parse/sync');

class CargoService {
    async importItems(file) {
        const items = parse(file.buffer.toString(), { columns: true, skip_empty_lines: true });
        for (const item of items) {
            await run(`
                INSERT OR REPLACE INTO items (itemId, name, width, depth, height, priority, expiryDate, usageLimit, preferredZone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [item.itemId, item.name, item.width, item.depth, item.height, item.priority, item.expiryDate, item.usageLimit, item.preferredZone]);
        }
        return { message: `${items.length} items imported` };
    }

    async importContainers(file) {
        const containers = parse(file.buffer.toString(), { columns: true, skip_empty_lines: true });
        for (const container of containers) {
            await run(`
                INSERT OR REPLACE INTO containers (containerId, zone, width, depth, height)
                VALUES (?, ?, ?, ?, ?)
            `, [container.containerId, container.zone, container.width, container.depth, container.height]);
        }
        return { message: `${containers.length} containers imported` };
    }

    async placeItems(data) {
        const items = await query('SELECT * FROM items WHERE containerId IS NULL');
        const containers = await query('SELECT * FROM containers');
        const { placements } = placeItems(data.items || items, data.containers || containers);

        for (const placement of placements) {
            await run('UPDATE items SET containerId = ? WHERE itemId = ?', [placement.containerId, placement.itemId]);
            await this.logAction('place', placement.itemId, 'system');
        }
        return { placements };
    }

    async searchItem(itemId) {
        const item = await query('SELECT * FROM items WHERE itemId = ?', [itemId]);
        return item[0] || { error: 'Item not found' };
    }

    async retrieveItem({ itemId, userId, timestamp }) {
        const item = await this.searchItem(itemId);
        if (!item.containerId) throw new Error('Item not stored');
        await run('UPDATE items SET status = ? WHERE itemId = ?', ['retrieved', itemId]);
        await this.logAction('retrieve', itemId, userId, timestamp);
        return { message: `Item ${itemId} retrieved`, item };
    }

    async identifyWaste() {
        const currentDate = new Date().toISOString().split('T')[0];
        const wasteItems = await query(`
            SELECT * FROM items 
            WHERE (expiryDate < ? AND expiryDate != 'N/A') OR usageLimit <= 0
        `, [currentDate]);
        return { wasteItems };
    }

    async planWasteReturn({ undockingContainerId, undockingDate, maxWeight }) {
        const wasteItems = (await this.identifyWaste()).wasteItems;
        let totalWeight = 0;
        const returnItems = [];

        for (const item of wasteItems) {
            const weight = item.width * item.depth * item.height * 0.1; // Arbitrary weight calc
            if (totalWeight + weight <= maxWeight) {
                totalWeight += weight;
                returnItems.push(item.itemId);
                await run('UPDATE items SET status = ?, containerId = ? WHERE itemId = ?', ['waste_planned', undockingContainerId, item.itemId]);
                await this.logAction('waste_plan', item.itemId, 'system');
            }
        }
        return { undockingContainerId, undockingDate, returnItems, totalWeight };
    }

    async simulateDay({ numOfDays, itemsToBeUsedPerDay }) {
        for (let day = 1; day <= numOfDays; day++) {
            for (const item of itemsToBeUsedPerDay) {
                const currentItem = await this.searchItem(item.itemId);
                if (currentItem.usageLimit > 0) {
                    await run('UPDATE items SET usageLimit = usageLimit - 1 WHERE itemId = ?', [item.itemId]);
                    await this.logAction('use', item.itemId, 'system');
                }
            }
        }
        return { message: `Simulated ${numOfDays} days` };
    }

    async getLogs({ startDate, endDate }) {
        const logs = await query('SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?', [startDate, endDate]);
        return { logs };
    }

    async logAction(action, itemId, userId, timestamp = new Date().toISOString()) {
        await run('INSERT INTO logs (action, itemId, userId, timestamp) VALUES (?, ?, ?, ?)', [action, itemId, userId, timestamp]);
    }
}

module.exports = new CargoService();