namespace CANNON
{
    QUnit.module("Trimesh", () =>
    {

        QUnit.test("updateNormals", (test) =>
        {
            var mesh = Trimesh.createTorus();
            mesh.normals[0] = 1;
            mesh.updateNormals();
            test.ok(mesh.normals[0] !== 1);
        });

        QUnit.test("updateAABB", (test) =>
        {
            var mesh = Trimesh.createTorus();
            mesh.aabb.lowerBound.set(1, 2, 3);
            mesh.updateAABB();
            test.ok(mesh.aabb.lowerBound.y !== 2);
        });

        QUnit.test("updateTree scaled", (test) =>
        {
            var mesh = Trimesh.createTorus();
            mesh.updateTree();

            var bigMesh = Trimesh.createTorus();
            bigMesh.setScale(new Vec3(2, 2, 2));

            test.equal(bigMesh.aabb.upperBound.x, mesh.aabb.upperBound.x * 2, 'AABB does not scale with the mesh!');

            test.equal(bigMesh.tree.aabb.upperBound.x, mesh.tree.aabb.upperBound.x, 'Octree AABB scales with the mesh, which is wrong!');

        });

        QUnit.test("getTrianglesInAABB unscaled", (test) =>
        {
            var mesh = Trimesh.createTorus(1, 1, 32, 32);
            var result = [];

            // Should get all triangles if we use the full AABB
            var aabb = mesh.aabb.clone();
            mesh.getTrianglesInAABB(aabb, result);
            test.equal(result.length, mesh.indices.length / 3);

            // Should get less triangles if we use the half AABB
            result.length = 0;
            aabb.lowerBound.scaleNumberTo(0.1, aabb.lowerBound);
            aabb.upperBound.scaleNumberTo(0.1, aabb.upperBound);
            mesh.getTrianglesInAABB(aabb, result);

            console.log(result.length, mesh.indices.length / 3)

            test.ok(result.length < mesh.indices.length / 3);

        });

        // scaled: function(test){
        //     var mesh = Trimesh.createTorus(1,1,16,16);
        //     var result = [];

        //     // Should get all triangles if we use the full AABB
        //     var aabb = mesh.aabb.clone();
        //     mesh.getTrianglesInAABB(aabb, result);
        //     test.equal(result.length, mesh.indices.length / 3);

        //     // Should get less triangles if we use the half AABB
        //     result.length = 0;
        //     aabb.lowerBound.scale(0.5, aabb.lowerBound);
        //     aabb.upperBound.scale(0.5, aabb.upperBound);
        //     mesh.getTrianglesInAABB(aabb, result);
        //     test.ok(result.length < mesh.indices.length / 3);

        //     test.done();
        // }

        QUnit.test("getVertex unscaled", (test) =>
        {
            var mesh = Trimesh.createTorus();
            var vertex = new Vec3();
            mesh.getVertex(0, vertex);
            test.deepEqual(vertex, new Vec3(mesh.vertices[0], mesh.vertices[1], mesh.vertices[2]));
        });

        QUnit.test("getVertex scaled", (test) =>
        {
            var mesh = Trimesh.createTorus();
            mesh.setScale(new Vec3(1, 2, 3));
            var vertex = new Vec3();
            mesh.getVertex(0, vertex);
            test.deepEqual(vertex, new Vec3(1 * mesh.vertices[0], 2 * mesh.vertices[1], 3 * mesh.vertices[2]));
        });

        QUnit.test("getWorldVertex", (test) =>
        {
            var mesh = Trimesh.createTorus();
            var vertex = new Vec3();
            mesh.getWorldVertex(0, new Vec3(), new Quaternion(), vertex);
            test.deepEqual(vertex, new Vec3(mesh.vertices[0], mesh.vertices[1], mesh.vertices[2]));
        });

        QUnit.test("getTriangleVertices", (test) =>
        {
            var mesh = Trimesh.createTorus();
            var va = new Vec3();
            var vb = new Vec3();
            var vc = new Vec3();
            var va1 = new Vec3();
            var vb1 = new Vec3();
            var vc1 = new Vec3();
            mesh.getVertex(mesh.indices[0], va);
            mesh.getVertex(mesh.indices[1], vb);
            mesh.getVertex(mesh.indices[2], vc);
            mesh.getTriangleVertices(0, va1, vb1, vc1);
            test.deepEqual(va, va1);
            test.deepEqual(vb, vb1);
            test.deepEqual(vc, vc1);
        });

        QUnit.test("getNormal", (test) =>
        {
            var mesh = Trimesh.createTorus();
            var normal = new Vec3();
            mesh.getNormal(0, normal);
            test.deepEqual(new Vec3(mesh.normals[0], mesh.normals[1], mesh.normals[2]), normal);
        });

        QUnit.test("calculateLocalInertia", (test) =>
        {
            var mesh = Trimesh.createTorus();
            var inertia = new Vec3();
            mesh.calculateLocalInertia(1, inertia);
            test.ok(true);
        });

        QUnit.test("computeLocalAABB", (test) =>
        {
            console.log('Trimesh::computeLocalAABB is todo');
            test.ok(true);
        });

        QUnit.test("updateBoundingSphereRadius", (test) =>
        {
            console.log('Trimesh::updateBoundingSphereRadius is todo');
            test.ok(true);
        });

        QUnit.test("calculateWorldAABB", (test) =>
        {
            var poly = Trimesh.createTorus();
            var min = new Vec3();
            var max = new Vec3();
            poly.calculateWorldAABB(
                new Vec3(1, 0, 0), // Translate 2 x in world
                new Quaternion(0, 0, 0, 1),
                min,
                max
            );
            test.ok(!isNaN(min.x));
            test.ok(!isNaN(max.x));
        });

        QUnit.test("volume", (test) =>
        {
            var mesh = Trimesh.createTorus();
            test.ok(mesh.volume() > 0);
        });

        QUnit.test("narrowphaseAgainstPlane", (test) =>
        {
            var world = new World();

            var torusShape = Trimesh.createTorus();
            var torusBody = new Body({
                mass: 1
            });
            torusBody.addShape(torusShape);

            var planeBody = new Body({
                mass: 1
            });
            planeBody.addShape(new Plane());

            world.addBody(torusBody);
            world.addBody(planeBody);

            world.step(1 / 60);
            test.ok(true);
        });
    });
}