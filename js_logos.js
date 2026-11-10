// ==========================================
// ARCHIVO DE LOGOS — SIGR-PC (OFICIAL CON BANNER)
// ==========================================

// Encabezado limpio (SIN Gobernación, altura exacta)
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

// Pie de página oficial utilizando el banner unificado pie_pagina.png
window.pieDePaginaPDF = function(doc){
    var total = doc.internal.getNumberOfPages();
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();

    return cargarImagenBase64('pie_pagina.png', null).then(function(imgBanner){
        for(var i = 1; i <= total; i++){
            doc.setPage(i);
            
            // Línea divisoria del pie de página
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(12, H - 22, W - 12, H - 22);

            try {
                if(imgBanner){
                    var anchoBanner = 125; // Ancho perfecto para centrar el bloque en la página
                    var altoBanner = 11;   // Altura proporcional sin deformar los logos
                    var xBanner = (W - anchoBanner) / 2;
                    var yBanner = H - 19;
                    
                    doc.addImage(imgBanner, 'PNG', xBanner, yBanner, anchoBanner, altoBanner);
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
