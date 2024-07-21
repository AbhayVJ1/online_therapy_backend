export const execQuery = function (ConPool, Qry, params = [], callback) {
      if (callback && typeof callback === "function") {
          ConPool.getConnection(function (err, connection) {
              if (err) {
                  console.error("Connection error", err);
                  callback(err, null);
                  return;
              }
  
              connection.query(Qry, params, function (err, rows) {
                  connection.release();
                  if (err) {
                      console.error("Query error", err);
                      callback(err, null);
                      return;
                  }
                  callback(null, rows);
              });
          });
      } else {
          return new Promise((resolve, reject) => {
              ConPool.getConnection((err, connection) => {
                  if (err) {
                      console.error("Connection error", err);
                      reject({ "err_status": 500, "err_message": "Internal server error" });
                      return;
                  }
  
                  connection.query(Qry, params, (err, rows) => {
                      connection.release();
                      if (err) {
                          console.error("Query error", err);
                          reject({ "err_status": 500, "err_message": "Internal server error" });
                          return;
                      }
                      resolve(rows);
                  });
              });
          });
      }
  };
  