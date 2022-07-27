namespace CANNON
{
    QUnit.module("Sphere", () =>
    {

        QUnit.test("throwOnWrongRadius", (test) =>
        {

            // These should be all right
            new Sphere(1);
            new Sphere(0);

            test.throws(function ()
            {
                new Sphere(-1);
            }, Error, 'Should throw on negative radius');

            test.ok(true);
        });

    });
}