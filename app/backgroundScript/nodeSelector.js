import Logger from 'lib/logger';
import Utils from 'lib/utils';
import md5 from 'md5';

import { LOCALSTORAGE_NAMESPACE } from 'lib/constants';

const logger = new Logger('nodes');

// validate node address in utils function

const DEFAULT_NODE = '34BD2B5CEBB1FB295117F7CD29056525';

const nodeSelector = {
    init() {
        this._node = DEFAULT_NODE;
        this._storageKey = `${ LOCALSTORAGE_NAMESPACE }_NODES`;

        this._defaultNodes = {
            [DEFAULT_NODE]: {
                name: 'TronWatch Private TestNet',
                full: 'http://rpc.tron.watch:8090',
                solidity: 'http://rpc.tron.watch:8091',
                websocket: 'ws://rpc.tron.watch:8080',
                mainnet: false
            }
        };

        this._readUserNodes();
    },

    _readUserNodes() {
        logger.info('Reading nodes from local storage');

        this._userNodes = {};
        this._nodes = {};

        const {
            selectedNode,
            nodes
        } = Utils.loadStorage(this._storageKey);

        logger.info({ selectedNode, nodes });

        this._userNodes = nodes || {};

        this._nodes = {
            ...this._defaultNodes,
            ...this._userNodes
        };

        logger.info(`Found ${ Object.keys(this._userNodes).length } user nodes`);

        this.setNode(selectedNode);
    },

    _saveState() {
        logger.info('Writing node configuration to local storage');

        Utils.saveStorage({
            selectedNode: this._node,
            nodes: this._userNodes
        }, this._storageKey);
    },

    addNode(node) {
        const error = Utils.validateNode(node);

        if(error) {
            logger.warn('Invalid node provided', node);
            logger.error('Node error:', error);

            return error;
        }

        logger.info('Adding new node', node);

        const {
            name,
            full,
            solidity,
            websocket,
            mainnet
        } = node;

        const nodeHash = md5([ full, solidity, websocket ].join('&'));

        this._userNodes[nodeHash] = { name, full, solidity, websocket, mainnet };
        this._nodes[nodeHash] = { name, full, solidity, websocket, mainnet };

        this._saveState();
    },

    removeNode(nodeHash) {
        logger.info(`Removing node ${ nodeHash }`);

        // Only remove from _userNodes to prevent removing default node
        delete this._userNodes[nodeHash];

        this._saveState();
        this._readUserNodes();
    },

    setNode(nodeHash) {
        if(!nodeHash || !this._nodes[nodeHash])
            return logger.warn(`Attempted to set invalid node ${ nodeHash }`);

        logger.info(`Setting node to ${ nodeHash }`);

        this._node = nodeHash;
        this._saveState();
    },

    get node() {
        if(!this._nodes[this._node])
            this._node = DEFAULT_NODE;

        return {
            ...this._nodes[this._node],
            nodeHash: this._node
        };
    },

    get nodes() {
        return {
            selectedNode: this._node,
            nodes: this._nodes
        };
    }
};

nodeSelector.init();

export default nodeSelector;