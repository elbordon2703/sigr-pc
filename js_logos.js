// ==========================================
// ARCHIVO NUEVO PARA FORZAR LOS LOGOS NUEVOS
// ==========================================

// Sobreescribimos el encabezado con el diseño correcto (SIN Gobernación)
window.encabezadoPDF = function(doc, titulo, subtitulo){
  var W = doc.internal.pageSize.getWidth();
  var fecha = new Date().toLocaleDateString('es-VE');
  var centro = W / 2;

  return cargarImagenBase64('logo_renace.png', null).then(function(imgRenace){
    if(imgRenace) { try { doc.addImage(imgRenace, 'PNG', 12, 8, 25, 20); } catch(e){} }

    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(11,42,74);
    doc.text('PROTECCIÓN CIVIL — MUNICIPIO PAPELÓN', centro, 16, {align:'center'});

    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.text('Estado Portuguesa — Venezuela', centro, 21, {align:'center'});

    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    doc.text(titulo.toUpperCase(), centro, 30, {align:'center'});

    if(subtitulo){
      doc.setFont('helvetica','normal');
      doc.setFontSize(9);
      doc.setTextColor(90,90,90);
      doc.text(subtitulo, centro, 35, {align:'center'});
    }

    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.text('Fecha: '+fecha, centro, 40, {align:'center'});

    doc.setDrawColor(11,42,74);
    doc.setLineWidth(0.6);
    doc.line(10, 44, W-10, 44);
    
    doc.setTextColor(0,0,0);
    return 50; 
  });
};

// Sobreescribimos el pie de página con los 4 logos calculados
window.pieDePaginaPDF = function(doc){
  var total = doc.internal.getNumberOfPages();
  var W = doc.internal.pageSize.getWidth();
  var H = doc.internal.pageSize.getHeight();

  return Promise.all([
    cargarImagenBase64('logo_venezuela.png', null),
    cargarImagenBase64('logo_ministerio.png', null),
    cargarImagenBase64('logopc.png', null),
    cargarImagenBase64('LOGO GOBERNACION.png', null)
  ]).then(function(imgs){
    for(var i=1; i<=total; i++){
      doc.setPage(i);
      doc.setDrawColor(200,200,200);
      doc.setLineWidth(0.3);
      doc.line(15, H-22, W-15, H-22);

      try{
        var altoLogo = 8;
        var anchoV = 20, anchoM = 30, anchoP = 8, anchoG = 20, espacio = 10;
        var anchoTotal = anchoV + anchoM + anchoP + anchoG + (espacio * 3);
        var xActual = (W - anchoTotal) / 2;
        var yLogos = H - 18;

        if(imgs[0]) { doc.addImage(imgs[0], 'PNG', xActual, yLogos, anchoV, altoLogo); xActual += anchoV + espacio; }
        if(imgs[1]) { doc.addImage(imgs[1], 'PNG', xActual, yLogos, anchoM, altoLogo); xActual += anchoM + espacio; }
        if(imgs[2]) { doc.addImage(imgs[2], 'PNG', xActual, yLogos, anchoP, altoLogo); xActual += anchoP + espacio; }
        if(imgs[3]) { doc.addImage(imgs[3], 'PNG', xActual, yLogos, anchoG, altoLogo); }
      }catch(e){}

      doc.setFont('helvetica','normal');
      doc.setFontSize(6);
      doc.setTextColor(150,150,150);
      doc.text('SIGR-PC | Protección Civil - Municipio Papelón', 15, H-5);
      doc.text('Página '+i+' de '+total, W-15, H-5, {align:'right'});
    }
    doc.setTextColor(0,0,0);
  });
};
