// ==========================================
// ARCHIVO NUEVO PARA FORZAR LOS LOGOS NUEVOS
// ==========================================

// Sobreescribimos el encabezado con el diseño correcto (SIN Gobernación)
window.encabezadoPDF = function(doc, titulo, subtitulo){
    var W = doc.internal.pageSize.getWidth();
    var centro = W / 2;

    return cargarImagenBase64('logo_renace.png', null).then(function(imgRenace){
        if(imgRenace) { try { doc.addImage(imgRenace, 'PNG', 12, 8, 22, 11); } catch(e){} }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(11, 42, 74);
        doc.text('PROTECCIÓN CIVIL — MUNICIPIO PAPELÓN', centro, 13, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text('Estado Portuguesa — Venezuela', centro, 17, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(titulo.toUpperCase(), centro, 23, { align: 'center' });

        if(subtitulo){
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(90, 90, 90);
            doc.text(subtitulo, centro, 27, { align: 'center' });
        }

        doc.setDrawColor(11, 42, 74);
        doc.setLineWidth(0.4);
        doc.line(12, 30, W - 12, 30);
        
        doc.setTextColor(0, 0, 0);
        return 34; 
    });
};

// Sobreescribimos el pie de página con los 4 logos usando los nombres EXACTOS de GitHub
window.pieDePaginaPDF = function(doc){
    var total = doc.internal.getNumberOfPages();
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();

    return Promise.all([
        cargarImagenBase64('logo_venezuela.png', null),
        cargarImagenBase64('logo_ministerio.png', null),
        cargarImagenBase64('LOGOPC.PNG', null),          // Nombres exactos de la captura
        cargarImagenBase64('LOGO GOBERNACION.png', null) // Nombres exactos de la captura
    ]).then(function(imgs){
        for(var i = 1; i <= total; i++){
            doc.setPage(i);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(12, H - 20, W - 12, H - 20);

            try {
                var altoLogo = 7;
                var anchos = [16, 22, 10, 16]; 
                var espacio = 6;
                var anchoTotal = anchos.reduce(function(a, b){ return a + b; }, 0) + (espacio * (anchos.length - 1));
                var xActual = (W - anchoTotal) / 2;
                var yLogos = H - 17;

                for(var j = 0; j < imgs.length; j++){
                    if(imgs[j]){
                        doc.addImage(imgs[j], 'PNG', xActual, yLogos, anchos[j], altoLogo);
                    }
                    xActual += anchos[j] + espacio;
                }
            } catch(e){}

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(150, 150, 150);
            doc.text('SIGR-PC | Protección Civil - Municipio Papelón', 12, H - 6);
            doc.text('Página ' + i + ' de ' + total, W - 12, H - 6, { align: 'right' });
        }
        doc.setTextColor(0, 0, 0);
    });
};
