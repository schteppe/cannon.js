namespace CANNON
{
    QUnit.module("Quaternion", () =>
    {

        QUnit.test("creation", (test) =>
        {
            test.expect(4);

            var q = new Quaternion(1, 2, 3, 4);
            test.equal(q.x, 1, "Creating should set the first parameter to the x value");
            test.equal(q.y, 2, "Creating should set the second parameter to the y value");
            test.equal(q.z, 3, "Creating should set the third parameter to the z value");
            test.equal(q.w, 4, "Creating should set the third parameter to the z value");

        });

        QUnit.test("toEuler", (test) =>
        {
            test.expect(3);

            var q = new Quaternion();
            q.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4);
            var euler = new Vector3();
            q.toEuler(euler);

            // we should expect (0,0,pi/4)
            test.equal(euler.x, 0, "euler x should be zero, got " + euler.x);
            test.equal(euler.y, 0, "euler y should be yero, got " + euler.y);
            test.ok(Math.abs(euler.z - Math.PI / 4) < 0.001, "euler z should be " + (Math.PI / 4) + ", got " + euler.z);

        });

        QUnit.test("setFromVectors", (test) =>
        {
            var q = new Quaternion();
            q.setFromVectors(new Vector3(1, 0, 0), new Vector3(-1, 0, 0));
            test.ok(q.vmult(new Vector3(1, 0, 0)).equals(new Vector3(-1, 0, 0)));

            q.setFromVectors(new Vector3(0, 1, 0), new Vector3(0, -1, 0));
            test.ok(q.vmult(new Vector3(0, 1, 0)).equals(new Vector3(0, -1, 0)));

            q.setFromVectors(new Vector3(0, 0, 1), new Vector3(0, 0, -1));
            test.ok(q.vmult(new Vector3(0, 0, 1)).equals(new Vector3(0, 0, -1)));

        });

        QUnit.test("slerp", (test) =>
        {
            var qa = new Quaternion();
            var qb = new Quaternion();
            qa.slerpTo(qb, 0.5, qb);
            test.deepEqual(qa, qb);

            qa.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4);
            qb.fromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 4);
            qa.slerpTo(qb, 0.5, qb);
            test.deepEqual(qb, new Quaternion());

        });
    });
}