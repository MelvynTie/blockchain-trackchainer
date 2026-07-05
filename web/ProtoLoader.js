/**
 * Copyright 2018 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const grpc = require('grpc');
const protobuf = require('protobufjs');

/**
 * A class for easily loading service descriptors and client stub definitions from
 * .proto files at runtime.
 */
class ProtoLoader {

	/**
	 * Load service descriptors and client stub definitions from a .proto file.
	 * @param {string} filename The filename of the .proto file.
	 * @param {Object} [options]  The options used to load the .proto file.
	 * @returns {*} The loaded service descriptors and client stub definitions.
	 */
	static load(filename) {
		const grpc = require('grpc');
		const builder = protobuf.loadProtoFile(filename);
		if (grpc.loadObject) {
			try {
				return grpc.loadObject(builder, {protobufjsVersion: 5});
			} catch(err) {}
		}

		// Fallback for @grpc/grpc-js:
		// 1. Get message constructors from protobufjs
		const namespace = builder.build();

		// 2. Get service clients from @grpc/proto-loader
		try {
			const protoLoader = require('@grpc/proto-loader');
			const packageDefinition = protoLoader.loadSync(filename, {
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true
			});
			const grpcObj = grpc.loadPackageDefinition(packageDefinition);
			
			// Deep merge grpcObj into namespace to provide both Services and Messages
			const merge = (target, source) => {
				for (const key of Object.keys(source)) {
					if (source[key] instanceof Object && key in target) {
						Object.assign(source[key], merge(target[key], source[key]));
					}
				}
				Object.assign(target || {}, source);
				return target;
			};
			merge(namespace, grpcObj);
		} catch(err) {}

		return namespace;
	}

}

module.exports = ProtoLoader;
