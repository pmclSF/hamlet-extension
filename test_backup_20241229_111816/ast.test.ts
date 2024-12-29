import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { ASTHelper } from "../../utils/ast-helpers";

describe("AST Tests", () => {
    describe("Node Creation", () => {
        it("creates test nodes correctly", () => {
            const node = ASTHelper.createTestNode("Test Title", "test body");
            assert.strictEqual(node.type, "test");
            assert.strictEqual(node.name, "Test Title");
            assert.strictEqual(node.body, "test body");
            assert.ok(Array.isArray(node.children));
        });

        it("creates suite nodes correctly", () => {
            const node = ASTHelper.createSuiteNode("Suite Title");
            assert.strictEqual(node.type, "suite");
            assert.strictEqual(node.name, "Suite Title");
            assert.ok(Array.isArray(node.children));
        });
    });

    describe("AST Traversal", () => {
        it("traverses nodes in correct order", () => {
            const root = ASTHelper.createSuiteNode("Root");
            const child1 = ASTHelper.createSuiteNode("Child 1");
            const child2 = ASTHelper.createTestNode("Test 1", "body");
            
            ASTHelper.addChildNode(root, child1);
            ASTHelper.addChildNode(child1, child2);
            
            const visited: string[] = [];
            ASTHelper.traverse(root, (node) => {
                visited.push(node.name || "");
            });
            
            assert.deepStrictEqual(visited, ["Root", "Child 1", "Test 1"]);
        });
    });
});
