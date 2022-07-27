namespace CANNON
{
    QUnit.module("Narrowphase", () =>
    {

        QUnit.test("sphereSphere", (test) =>
        {
            var world = new World();
            var cg = new Narrowphase(world);
            var result = [];
            var sphereShape = new Sphere(1);

            var bodyA = new Body({ mass: 1 });
            bodyA.addShape(sphereShape);
            var bodyB = new Body({ mass: 1 });
            bodyB.addShape(sphereShape);

            cg.currentContactMaterial = new ContactMaterial();
            cg.result = result;
            cg.sphereSphere(
                sphereShape,
                sphereShape,
                new Vector3(0.5, 0, 0),
                new Vector3(-0.5, 0, 0),
                new Quaternion(),
                new Quaternion(),
                bodyA,
                bodyB
            );

            test.equal(result.length, 1);
        });

        QUnit.test("sphereHeightfield", (test) =>
        {
            var world = new World();
            var cg = new Narrowphase(world);
            var result = [];
            var hfShape = createHeightfield();
            var sphereShape = new Sphere(0.1);
            cg.currentContactMaterial = new ContactMaterial();
            cg.result = result;
            cg.sphereHeightfield(
                sphereShape,
                hfShape,
                new Vector3(0.25, 0.25, 0.05), // hit the first triangle in the field
                new Vector3(0, 0, 0),
                new Quaternion(),
                new Quaternion(),
                new Body(),
                new Body()
            );

            test.equal(result.length, 1);

        });

    });

    function createHeightfield()
    {
        var matrix = [];
        var size = 20;
        for (var i = 0; i < size; i++)
        {
            matrix.push([]);
            for (var j = 0; j < size; j++)
            {
                matrix[i].push(0);
            }
        }
        var hfShape = new Heightfield(matrix, {
            elementSize: 1,
        });

        return hfShape;
    }
}