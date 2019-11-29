namespace CANNON
{
    QUnit.module("Mat3", () =>
    {

        QUnit.test("creation", (test) =>
        {
            test.expect(1);

            var m = new Matrix3x3();

            var success = true;
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    success = success && (m.getElement(r, c) == 0);

            test.ok(success, "creation without paramaters should return a null matrix");

        });

        QUnit.test("e", (test) =>
        {
            test.expect(2);

            var m = new Matrix3x3();

            // row 1, column 2
            m.setElement(1, 2, 5);

            test.equal(m.getElement(1, 2), 5, "write and access");

            var success = true;
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    if (r != 1 || c != 2)
                        success = success && (m.getElement(r, c) == 0);

            test.ok(success, "write should not touch the others elements");

        });

        QUnit.test("identity", (test) =>
        {
            test.expect(9);

            var m = new Matrix3x3();

            m.identity();

            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    test.equal(m.getElement(r, c), (r == c) ? 1 : 0, "cellule ( row : " + r + " column : " + c + " )  should be " + (c == r ? "1" : "0"));

        });

        QUnit.test("vmult", (test) =>
        {
            test.expect(1);

            var v = new Vector3(2, 3, 7);
            var m = new Matrix3x3();

            /*
              set the matrix to
              | 1 2 3 |
              | 4 5 6 |
              | 7 8 9 |
            */
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    m.setElement(r, c, 1 + r * 3 + c);
            var t = m.vmult(v);

            test.ok(t.x == 29 && t.y == 65 && t.z == 101, "Expected (29,65,101), got (" + t.toString() + "), while multiplying m=" + m.toString() + " with " + v.toString());
        });

        QUnit.test("mmult", (test) =>
        {
            test.expect(1);

            var m1 = new Matrix3x3();
            var m2 = new Matrix3x3();


            /* set the matrix to
                | 1 2 3 |
                | 4 5 6 |
                | 7 8 9 |
            */
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    m1.setElement(r, c, 1 + r * 3 + c);


            /* set the matrix to
             | 5 2 4 |
             | 4 5 1 |
             | 1 8 0 |
            */
            m2.setElement(0, 0, 5);
            m2.setElement(0, 1, 2);
            m2.setElement(0, 2, 4);
            m2.setElement(1, 0, 4);
            m2.setElement(1, 1, 5);
            m2.setElement(1, 2, 1);
            m2.setElement(2, 0, 1);
            m2.setElement(2, 1, 8);
            m2.setElement(2, 2, 0);

            var m3 = m1.mmult(m2);

            test.ok(m3.getElement(0, 0) == 16
                && m3.getElement(0, 1) == 36
                && m3.getElement(0, 2) == 6
                && m3.getElement(1, 0) == 46
                && m3.getElement(1, 1) == 81
                && m3.getElement(1, 2) == 21
                && m3.getElement(2, 0) == 76
                && m3.getElement(2, 1) == 126
                && m3.getElement(2, 2) == 36, "calculating multiplication with another matrix");

        });

        QUnit.test("solve", (test) =>
        {
            test.expect(2);

            var m = new Matrix3x3();
            var v = new Vector3(2, 3, 7);

            /* set the matrix to
            | 5 2 4 |
            | 4 5 1 |
            | 1 8 0 |
            */
            m.setElement(0, 0, 5);
            m.setElement(0, 1, 2);
            m.setElement(0, 2, 4);
            m.setElement(1, 0, 4);
            m.setElement(1, 1, 5);
            m.setElement(1, 2, 1);
            m.setElement(2, 0, 1);
            m.setElement(2, 1, 8);
            m.setElement(2, 2, 0);


            var t = m.solve(v);

            var vv = m.vmult(t);

            test.ok(vv.equals(v, 0.00001), "solving Ax = b");


            var m1 = new Matrix3x3();

            /* set the matrix to
             | 1 2 3 |
             | 4 5 6 |
             | 7 8 9 |
             */
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    m1.setElement(r, c, 1 + r * 3 + c);

            var error = false;

            try
            {
                m1.solve(v);
            } catch (e)
            {
                error = true
            }

            test.ok(error, "should rise an error if the system has no solutions");

        });

        QUnit.test("reverse", (test) =>
        {
            test.expect(2);

            var m = new Matrix3x3();

            /* set the matrix to
            | 5 2 4 |
            | 4 5 1 |
            | 1 8 0 |
            */
            m.setElement(0, 0, 5);
            m.setElement(0, 1, 2);
            m.setElement(0, 2, 4);
            m.setElement(1, 0, 4);
            m.setElement(1, 1, 5);
            m.setElement(1, 2, 1);
            m.setElement(2, 0, 1);
            m.setElement(2, 1, 8);
            m.setElement(2, 2, 0);


            var m2 = m.reverseTo();

            var m3 = m2.mmult(m);

            var success = true;
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    success = success && (Math.abs(m3.getElement(r, c) - (c == r ? 1 : 0)) < 0.00001);

            test.ok(success, "inversing");

            var m1 = new Matrix3x3();

            /* set the matrix to
            | 1 2 3 |
            | 4 5 6 |
            | 7 8 9 |
            */
            for (var c = 0; c < 3; c++)
                for (var r = 0; r < 3; r++)
                    m1.setElement(r, c, 1 + r * 3 + c);

            var error = false;

            try
            {
                m1.reverseTo();
            } catch (e)
            {
                error = true
            }

            test.ok(error, "should rise an error if the matrix is not inersible");

        });

        QUnit.test("transpose", (test) =>
        {
            var M = new Matrix3x3([1, 2, 3,
                4, 5, 6,
                7, 8, 9]);
            var Mt = M.transposeTo();
            test.deepEqual(Mt.elements, [1, 4, 7,
                2, 5, 8,
                3, 6, 9]);
        });

        QUnit.test("scale", (test) =>
        {
            var M = new Matrix3x3([1, 1, 1,
                1, 1, 1,
                1, 1, 1]);
            var Mt = M.scale(new Vector3(1, 2, 3));
            test.deepEqual(Mt.elements, [1, 2, 3,
                1, 2, 3,
                1, 2, 3]);
        });

        QUnit.test("setRotationFromQuaternion", (test) =>
        {
            var M = new Matrix3x3(),
                q = new Quaternion(),
                original = new Vector3(1, 2, 3);

            // Test zero rotation
            M.setRotationFromQuaternion(q);
            var v = M.vmult(original);
            test.ok(v.equals(original));

            // Test rotation along x axis
            q.setFromEuler(0.222, 0.123, 1.234);
            M.setRotationFromQuaternion(q);
            var Mv = M.vmult(original);
            var qv = q.vmult(original);

            test.ok(Mv.equals(qv));

        });
    });
}
