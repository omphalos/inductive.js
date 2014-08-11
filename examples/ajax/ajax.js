function setBodyHtml(arg0) {
  return void $('body').html(arg0);
}

function main() {
  return $.get('data.txt', function fn(arg0) {
    return setBodyHtml(arg0);
  });
}

main();
