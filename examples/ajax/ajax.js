function logJson() {
  return $.get('data.json', function fn(arg0) {
    return console.log(arg0);
  });
}

logJson();