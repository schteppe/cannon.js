/**
 * @class CANNON.ConvexHull
 * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
 * @author schteppe / https://github.com/schteppe
 * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
 * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
 */
CANNON.ConvexHull = function( vertices ) {
  var that = this;
  CANNON.Shape.call( this );

  /**
   * @property array vertices
   * @memberof CANNON.ConvexHull
   * @brief Array of CANNON.Vec3
   */
  this.vertices = [];

  /**
   * @property array faces
   * @memberof CANNON.ConvexHull
   * @brief Array of integer arrays, indicating which vertices each face consists of
   * @todo Needed?
   */
  this.faces = [];

  /**
   * @property array faceNormals
   * @memberof CANNON.ConvexHull
   * @brief Array of CANNON.Vec3
   * @todo Needed?
   */
  this.faceNormals = [];

  /**
   * @fn addPoints
   * @memberof ConvexHull
   * @brief Add points to the hull
   * @param array points An array of CANNON.Vec3's
   * @return bool
   * @todo Auto generate faces
   * @todo auto generate normals
   */
  this.addPoints = function( points , faces , normals ) {
    for(pi in points){
      var p = points[pi];
      if(!(p instanceof CANNON.Vec3)){
	throw "Argument 1 must be instance of CANNON.Vec3";
	return false;
      }
      this.vertices.push(p);
    }

    // @todo auto generate?
    this.faces = faces;
    this.normals = this.faceNormals;

    return true;
  }

  /**
   * @brief Clip the hull against a face
   * @param float position
   * @param CANNON.Vec3 normal
   * @return array An array of vertices
   * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
   */
  this.clipAgainstFace = function(separatingNormal,v1,v2,v3){
    // Clip polygon to back of planes of all faces of hull A that are adjacent to witness face
  };

  /**
   * Clip a face against a plane
   * @param int face_index
   * @param CANNON.Vec3 planeNormal
   * @param float planeConstant
   */
  function clipFaceAgainstPlane(face_index, planeNormal, planeConstant){
    var n_dot_first, n_dot_last, face = that.faces[face_index];
    var numVerts = face.length;
    var outVertices = [];

    if(numVerts < 2) return outVertices;
    
    var firstVertex = face[face.length-1];
    var lastVertex =   face[0];
    
    n_dot_first = planeNormal.dot(firstVertex) + planeConstant;
    
    for(var vi = 0; vi < numVerts; vi++){
      lastVertex = face[vi];
      n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
      if(n_dot_first < 0){
	if(n_dot_last<0){
	  // Start < 0, end < 0, so output lastVertex
	  outVertices.push(lastVertex);
	} else {
	  // Start < 0, end >= 0, so output intersection
	  outVertices.push(firstVertex.lerp(lastVertex,
					    n_dot_first * 1.0/(n_dot_first - n_dot_last)));
	}
      } else {
	if(n_dot_last<0){
	  // Start >= 0, end < 0 so output intersection and end
	  outVertices.push(firstVertex.lerp(lastVertex,
					    n_dot_first * 1.0/(n_dot_first - n_dot_last)));
	  outVertices.push(lastVertex);
	}
      }
      firstVertex = lastVertex;
      n_dot_first = n_dot_last;
    }
    return outVertices;
  }

  /**
   * Whether the face is visible from the vertex
   * @param array face
   * @param CANNON.Vec3 vertex
   */
  function visible( face, vertex ) {
    var va = that.vertices[ face[ 0 ] ];
    var vb = that.vertices[ face[ 1 ] ];
    var vc = that.vertices[ face[ 2 ] ];

    var n = new CANNON.Vec3();
    normal( va, vb, vc, n );

    // distance from face to origin
    var dist = n.dot( va );

    return n.dot( vertex ) >= dist;
  }

  /**
   * @brief Get face normal given 3 vertices
   * @param CANNON.Vec3 va
   * @param CANNON.Vec3 vb
   * @param CANNON.Vec3 vc
   * @param CANNON.Vec3 target
   * @todo unit test?
   */
  function normal( va, vb, vc, target ) {
    var cb = new CANNON.Vec3();
    var ab = new CANNON.Vec3();

    vb.vsub(va,ab);
    vc.vsub(vb,cb);
    cb.cross(ab,target);

    if ( !target.isZero() ) {
      target.normalize();
    }
  }

  /**
   * Detect whether two edges are equal.
   * Note that when constructing the convex hull, two same edges can only
   * be of the negative direction.
   * @return bool
   */
  function equalEdge( ea, eb ) {
    return ea[ 0 ] === eb[ 1 ] && ea[ 1 ] === eb[ 0 ]; 
  }

  /**
   * Create a random offset between -1e-6 and 1e-6.
   * @return float
   */
  function randomOffset() {
    return ( Math.random() - 0.5 ) * 2 * 1e-6;
  }
};

CANNON.ConvexHull.prototype = new CANNON.Shape();
CANNON.ConvexHull.prototype.constructor = CANNON.ConvexHull;