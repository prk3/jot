JSON Operational Transformation (JOT)
=====================================

By Joshua Tauberer <http://razor.occams.info>.

August 2013.

License: GPL v3 <http://choosealicense.com/licenses/gpl-v3/>

This module implements operational transformation on a JSON data model,
written in JavaScript for use either in node.js or browsers.

Basically this is the core of real time simultaneous editing, like Etherpad,
but for structured data rather than just plain text. Since everything can
be represented in JSON, this provides a superset of plain text collaboration
functionality.

This library:

* Models atomic changes to JSON data structures (operations).
* Inverts, composes, and rebases operations (transformations).
* Manages real-time collaborations between two or more users.
* Provides example client/server code and a working example.

There's no UI here, except in the example.

Introduction
------------

Here's an example of what this is all about. Say you start with:

	{
		"key1": "Hello world!",
		"key2": 10
	}

Then user A makes the following changes:

	{
		"title": "Hello world!",
		"count": 10
	}

and *simultanesouly* user B makes the following changes (to the original):

	{
		"key1": "My Program",
		"key2": 20
	}

How do you merge changes? In operational transformation, changes are represented
structurally:

	A = [("rename" : "key1" => "title"), ("rename" : "key2" => "count")]
	B = [("set" : "key1" => "My Program"), ("set" : "key2" => 20)]

If you were to apply these changes in sequence, you would have a problem.
By the time you get to B's changes, the keys "key1" and "key2" are no
longer there!

What you need is git's "rebase" that revises B given the simultaneous
edits in A. Here's what you get after "rebasing" B against A:

	B = [("set" : "title" => "My Program"), ("set" : "count" => 20)]

Now you *can* apply A and B sequentially.

Installation
------------

The code is written for the node.js platform, and it can also be built
for use in browsers.

Before running anything, you'll need to install the dependencies:

	npm install

To build the library for browsers, use:

	node build_browser_lib.js > jot.js

Example
-------

Here's example code that follows the example in the introduction:

	/* helpers and libraries */
	function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
	var ot = require("./jot/base.js");
	var spyobj = require("./jot/spyobject.js");

	/* here's the initial document */
	var doc = {
		key1: "Hello World!",
		key2: 10,
	};

	/* User 1 Makes Changes */
	var d1 = new spyobj.SpyObject(clone(doc));
	d1.rename("key1", "title");
	d1.rename("key2", "count");

	// d1 is now { title: 'Hello World!', count: 10 }

	/* User 2 Makes Changes */
	var d2 = new spyobj.SpyObject(clone(doc));
	d2.set("key1", "My Program");
	d2.inc("key2", 10); // an atomic increment!

	// d2 is now { key1: 'My Program', key2: 20 }

	/* Merge the Changes */

	var r1 = d1.pop_history();
	ot.apply_array(r1, doc);

	// doc is now { title: 'Hello World!', count: 10 }

	var r2 = d2.pop_history();
	r2 = ot.rebase_array(r1, r2);
	ot.apply_array(r2, doc);

	// doc is now { title: 'My Program', count: 20 }

To run:

	node example.js

Note how the output applies both users' changes logically, even though the
second user's changes specified "key1" and "key2", neither of which exist
by the time the revision is applied. It's the rebase_array call that takes
care of that.

An initial document (doc) is created. Changes are *simultaneously* made to
doc. Here we're using a utility class SpyObject which records the revisions
taken on it. SpoyObject.pop_history() returns the history of revisions made
on the object. We re-apply the first user's revision history to the original
object doc. Then we get the second user's changes, rebase them against the
first user's changes, and apply the rebased operations to the document.

Collaboration
-------------

The next step beyond merging edits through rebase is managing the state
needed to enable real-time simultaneous collaboration between multiple
clients. This involves some complex rebasing as well as handling the
cases of an edit conflict when a rebase isn't possible.

Interactive Example
-------------------

I've packaged an interactive example of multi-user collaborative editing
of a JSON data structure. The front-end is Jos de Jong's excellent
JSONEditor (https://github.com/josdejong/jsoneditor).

To run the interactive example, you'll also need get dependencies:

	json_editor_example/get_json_editor.sh

Then build jot.js, our library suitable for use within the browser:

	node build_browser_lib.js > json_editor_example/jot.js

Start an HTTP server which will serve the static files and also act
as a websockets server to handle the communication between the editors.

	node start.js

Finally, open http://localhost:8080/ in as many browser windows as you
like and start editing.

Operations
----------

Unlike most collaborative editing models where operations like insert and
delete apply simply to strings, the document model in JOT is JSON. This
makes JOT useful when tracking changes to data, rather than to text.

The operations in JOT are:

* INS: Insert text or array elements into an array.
* DEL: Delete text or array elements in an array.
* PUT: Add a new property to an object.
* DEL: Remove a property from an object.
* REN: Rename a property of an object.
* APPLY: Apply any operation to a particular array element or object property value.
* SET: Set a value (an array element, an object property, or an atomic value).
* MAP: Increment or multiply a number. (Increment supports a modulus.)
* MOVE: Move consecutive elements of an array from one index to another.

The JOT model is a superset of the model you need for basic plain text concurrent
editing. That is, it includes the entire text editing model in the INS and DEL
operations plus it adds new operations for non-string data structures.

(Interally, INS and DEL are subcases of "SPLICE" and PUT, DEL, and REN are subcases
of "PROP". There is also "NO_OP", which is an operation with no effect.)


Transformations
---------------

What makes JOT useful is that each operation knows how to "rebase" itself against
every other operation. This is the "transformation" part of operational transformation,
and it's what you do when you have two concurrent edits that need to be merged.

Let's say you have two operations A and B which represent simultaneous edits to
a common base document. For instance, A inserts three characters at the start of
the document and B, which was generated on some other machine concurrently, deletes
the character at index 6. Rebasing B against A yields a new operation B' that can be
applied sequentially *after* A but causes the same logical effect as the original B.
In this example, B' is the deletion of the character at index 9.

Applying two operations in sequence is called composition and is denoted with the
symbol ○. And lets denote B rebased against A as "B / A". So before the rebase we
have two operations A and B. After the rebase we have A and B/A, such that A ○ (B/A)
combines the logical intent of both A and B.

The rebase operation satisfies the constraints that 1) A ○ (B/A) == B ○ (A/B), and
2) C / (A ○ B) == (C / A) / B.

Real Time Collaboration
-----------------------
  
This is all put together in the CollaborationServer class which manages the state
needed to pass operations around between any number of concurrent editors. The library
is also used on the client side to merge incoming remote changes with what has already
been changed locally.

Notes
-----

Thanks to @konklone for some inspiration and the first pull request.

The Substance Operator library is very similar to this library. http://interior.substance.io/modules/operator.html

