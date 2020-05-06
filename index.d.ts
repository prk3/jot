declare module 'jot' {

	type OpJson = null | boolean | number | string | { [key: string]: OpJson } | OpJson[];
	type Document = null | boolean | number | string | { [key: string]: Document } | Document[];

	type Meta = {
		selections?: {
			[path: string]: {
				[id: string]: { start: number, end: number };
			};
		};
	};

	// operation class methods

	interface Operation {
		inspect(): string;
		isNoOp(): boolean;
		apply(document: Document, metaRef?: { meta: Meta }): Document;
		applyWithMeta(document: Document, meta: Meta): [Document, Meta];
		simplify(): Operation;
		drilldown(index_or_key: number | string): Operation;
		inverse(document: Document): Operation;
		compose(other: Operation): Operation;
		rebase(other: Operation): Operation | null;
		rebase(other: Operation, options: { document: Document; }): Operation;
		toJSON(): OpJson;
		serialize(): string;
	}

	// global functions

	function opFromJSON(data: OpJson): Operation;
	function deserialize(string: string): Operation;

	// general operations

	var NO_OP: {
		new(): Operation;
	};

	var SET: {
		new(new_value: Document): Operation;
	};

	var LIST: {
		new(operations: Operation[]): Operation;
	};

	// boolean and number operations

	var MATH: {
		new(op: 'and' | 'or' | 'xor' | 'add' | 'mult', value: number): Operation;
		new(op: 'and' | 'or' | 'xor', value: boolean): Operation;
		new(op: 'rot', value: [number, number]): Operation;
		new(op: 'not', value: null): Operation;
	};

	// string and array operations

	var SPLICE: {
		new(index: number, length: number, new_value: Document): Operation;
	};

	var ATINDEX: {
		new(index: number, operation: Operation): Operation;
		new(operations: { [index: number]: Operation }): Operation;
	};

	var MAP: {
		new(operation: Operation): Operation;
	};

	// object operations

	var PUT: {
		new(key: string | number, value: Document): Operation;
	};

	var REM: {
		new(key: string | number): Operation;
	};

	var APPLY: {
		new(key: string | number, operation: Operation): Operation;
		new(operations: { [key: string]: Operation, [key: number]: Operation }): Operation;
	};

	// document structure operations

	var COPY: {
		new(locations: [string, string][]): Operation;
	};

	// other

	var SELECT: {
		new(id: string, range: { start: number, end: number } | null): Operation;
		new(selections: { [id: string]: { start: number, end: number } | null }): Operation;
	};
}
