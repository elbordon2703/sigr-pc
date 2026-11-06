/* ============================================================
   MÓDULO OPERACIONES — v4 (Jefe + PDF + Botones)
   ============================================================ */

// 1. Agregar el campo del Jefe de Servicio cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var divGrupos = document.getElementById('opGrupoEntrante');
        if(divGrupos && !document.getElementById('opJefeServicio')) {
            var parent = divGrupos.parentNode.parentNode;
            var divJefe = document.createElement('div');
            divJefe.className = 'form-row';
            divJefe.innerHTML = '<div class="form-group"><label>Jefe de Servicio (JS) *</label><select id="opJefeServicio"><option value="">Seleccione el JS...</option></select></div>';
            parent.parentNode.insertBefore(divJefe, parent.nextSibling);
        }
    }, 1000);
});

// 2. Función para cargar el personal del grupo
window.cargarPersonalGrupoOperaciones = function() {
    var grupoSeleccionado = document.getElementById('opGrupoEntrante').value;
    var contenedor = document.getElementById('opPersonalContainer');
    var selectJefe = document.getElementById('opJefeServicio');
    
    if(!grupoSeleccionado){ 
        contenedor.innerHTML = '<p class="text-muted">Seleccione primero el Grupo Entrante para cargar el personal.</p>'; 
        if(selectJefe) selectJefe.innerHTML = '<option value="">Seleccione el JS...</option>';
        return; 
    }
    contenedor.innerHTML = '<p class="text-muted">Cargando personal del ' + grupoSeleccionado + '...</p>';
    var letraGrupo = grupoSeleccionado.replace('Grupo ', '').trim();

    db.collection('personal').get().then(function(snap){
        var oficiales = [];
        snap.forEach(function(doc){
            var d = doc.data(); d.id = doc.id;
            var pertenece = false;
            if(d.grupo === letraGrupo) pertenece = true;
            if(d.grupos && Array.isArray(d.grupos) && d.grupos.indexOf(letraGrupo) !== -1) pertenece = true;
            if(d.estado === 'baja') pertenece = false;
            if(pertenece) oficiales.push(d);
        });

        if(oficiales.length === 0){ 
            contenedor.innerHTML = '<p style="color:red;">No hay oficiales asignados al ' + grupoSeleccionado + '.</p>'; 
            if(selectJefe) selectJefe.innerHTML = '<option value="">No hay oficiales</option>';
            return; 
        }

        if(selectJefe) {
            var opsJefe = '<option value="">Seleccione el JS...</option>';
            oficiales.forEach(function(d){
                var nombre = (d.jerarquia || '') + ' ' + (d.nombre || '') + ' ' + (d.apellido || '');
                opsJefe += '<option value="' + nombre + '">' + nombre + '</option>';
            });
            selectJefe.innerHTML = opsJefe;
        }

        var html = '<table style="width:100%; font-size:12px; text-align:left; border-collapse: collapse;"><tr style="background:#eee;"><th style="padding:4px;">Oficial</th><th style="padding:4px; text-align:center;">Asistió</th><th style="padding:4px;">Estado</th><th style="padding:4px;">Responsabilidades</th></tr>';
        oficiales.forEach(function(d){
            var nombre = (d.jerarquia || '') + ' ' + (d.nombre || '') + ' ' + (d.apellido || '');
            var estados = ['activo', 'disponible', 'en_servicio', 'reposo', 'permiso', 'vacaciones', 'comision_municipio', 'comision_nacional', 'comision_internacional', 'apoyo_instituciones', 'apoyo_zoedan', 'apoyo_pc_municipio', 'baja'];
            var ops = ''; estados.forEach(function(est){ ops += '<option value="' + est + '" ' + (d.estado === est ? 'selected' : '') + '>' + est.replace(/_/g, ' ') + '</option>'; });
            html += '<tr style="border-bottom:1px solid #ddd;"><td style="padding:4px;">' + nombre + '<br><span style="font-size:10px; color:#666;">' + (d.cedula || '') + '</span></td><td style="padding:4px; text-align:center;"><input type="checkbox" class="opAsistencia" data-id="' + d.id + '" checked style="transform:scale(1.3);"></td><td style="padding:4px;"><select class="opEstadoOficial" data-id="' + d.id + '" style="font-size:11px; padding:2px;">' + ops + '</select></td><td style="padding:4px;"><input type="text" class="opRespOficial" data-id="' + d.id + '" value="" placeholder="Asigne función(es)..." style="width:100%; font-size:11px; padding:2px;"></td></tr>';
        });
        html += '</table>';
        contenedor.innerHTML = html;
    });
};

// 3. Función para Guardar
window.guardarApertura = function(){
    var grupoEntrante = document.getElementById('opGrupoEntrante').value;
    var grupoSaliente = document.getElementById('opGrupoSaliente').value;
    var jefeServicio = document.getElementById('opJefeServicio') ? document.getElementById('opJefeServicio').value : 'Por asignar';
    
    if(!grupoEntrante || !grupoSaliente || !jefeServicio){
        alert('Debe seleccionar el Grupo Entrante, Grupo Saliente y el Jefe de Servicio.');
        return;
    }

    var btn = document.querySelector('button[onclick="guardarApertura()"]');
    if(btn){ btn.disabled = true; btn.textContent = 'Guardando...'; }

    var personal = [];
    var filas = document.querySelectorAll('#opPersonalContainer table tr');
    for(var i=1; i<filas.length; i++){ 
        var fila = filas[i];
        personal.push({
            id_oficial: fila.querySelector('.opAsistencia').getAttribute('data-id'),
            nombre: fila.querySelector('td').innerHTML,
            asistio: fila.querySelector('.opAsistencia').checked,
            estado: fila.querySelector('.opEstadoOficial').value,
            responsabilidades: fila.querySelector('.opRespOficial').value.trim() ? fila.querySelector('.opRespOficial').value.split(',').map(function(s){return s.trim()}) : []
        });
    }

    var fileEncuadre = document.getElementById('opFotoEncuadre').files[0];
    var filePlanilla = document.getElementById('opFotoPlanilla').files[0];
    var promesasFotos = [];
    
    if(fileEncuadre){ promesasFotos.push(comprimirImagen(fileEncuadre, 800, 0.6).then(function(b64){ return {nombre: 'encuadre', base64: b64}; })); }
    if(filePlanilla){ promesasFotos.push(comprimirImagen(filePlanilla, 800, 0.6).then(function(b64){ return {nombre: 'planilla', base64: b64}; })); }

    Promise.all(promesasFotos).then(function(fotos){
        var fotosObj = {};
        fotos.forEach(function(f){ fotosObj['foto_' + f.nombre] = f.base64; });

        var data = {
            fechaApertura: firebase.firestore.FieldValue.serverTimestamp(),
            grupo: grupoEntrante,
            grupoSaliente: grupoSaliente,
            jefe: jefeServicio,
            estado: 'abierto',
            personal: personal,
            instalaciones: document.getElementById('opEstadoInstalaciones').value.trim(),
            novedades: document.getElementById('opNovedades').value.trim(),
            observaciones: document.getElementById('opObservaciones').value.trim(),
            foto_encuadre: fotosObj['foto_encuadre'] || '',
            foto_planilla: fotosObj['foto_planilla'] || '',
            creadoPor: window.SIGR.usuario.email,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };

        return db.collection('servicio').add(data);
    }).then(function(ref){
        alert('¡Servicio aperturado y guardado con éxito!');
        cerrarModal('modalApertura');
        cargarOperaciones(); 
        if(btn){ btn.disabled = false; btn.textContent = 'Guardar Apertura'; }
    }).catch(function(e){
        console.error('Error guardando servicio:', e);
        alert('Error al guardar: ' + e.message);
        if(btn){ btn.disabled = false; btn.textContent = 'Guardar Apertura'; }
    });
};

// 4. Función para dibujar la Tabla con botones
window.cargarOperaciones = function(){
    var tbody = document.getElementById('tablaServiciosBody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando servicios...</td></tr>';

    db.collection('servicio').orderBy('fechaRegistro', 'desc').limit(50).get().then(function(snap){
        if(snap.empty){
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No hay servicios registrados.</td></tr>';
            return;
        }
        var html = '';
        snap.forEach(function(doc){
            var d = doc.data();
            var fAux = d.fechaApertura;
            if(fAux && typeof fAux.toDate === 'function') fAux = fAux.toDate(); 
            var fDate = fAux ? new Date(fAux) : null;
            var fecha = fDate ? fDate.toLocaleDateString('es-VE') : '—';
            var hora = fDate ? fDate.toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit', hour12: false}) : '—';
            var badgeEstado = d.estado === 'abierto' ? '<span class="badge badge-success">Abierto</span>' : '<span class="badge badge-secondary">Cerrado</span>';
            
            var botones = '';
            if(d.estado === 'abierto'){
                botones = '<button class="btn btn-sm btn-secondary" onclick="verPDFServicio(\'' + doc.id + '\')">PDF</button> ';
                botones += '<button class="btn btn-sm btn-primary" onclick="editarServicio(\'' + doc.id + '\')">Editar</button> ';
                botones += '<button class="btn btn-sm btn-danger" onclick="cerrarServicio(\'' + doc.id + '\')">Cerrar</button>';
            } else {
                botones = '<button class="btn btn-sm btn-secondary" onclick="verPDFServicio(\'' + doc.id + '\')">Ver PDF</button>';
            }

            html += '<tr><td>' + fecha + '</td><td>' + hora + '</td><td>' + (d.grupo || '—') + '</td><td>' + (d.jefe || '—') + '</td><td>' + badgeEstado + '</td><td>' + botones + '</td></tr>';
        });
        tbody.innerHTML = html;
    }).catch(function(e){
        console.error('Error cargando servicios:', e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Error al cargar los servicios.</td></tr>';
    });
};

// 5. Función del PDF
window.verPDFServicio = function(id){
    db.collection('servicio').doc(id).get().then(function(doc){
        if(!doc.exists){ alert('Servicio no encontrado'); return; }
        var d = doc.data();
        var docPdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        var W = docPdf.internal.pageSize.getWidth();
        var M = 15;
        
        encabezadoPDF(docPdf, 'APERTURA DE SERVICIO', null).then(function(y){
            var fAux = d.fechaApertura;
            if(fAux && typeof fAux.toDate === 'function') fAux = fAux.toDate();
            var fDate = fAux ? new Date(fAux) : new Date();
            var fechaStr = fDate.toLocaleDateString('es-VE');
            var horaStr = fDate.toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit', hour12: false});
            
            docPdf.setFontSize(10); docPdf.setFont('helvetica', 'bold');
            docPdf.text('Fecha: ' + fechaStr + '  |  Hora: ' + horaStr + ' HLV', M, y); y += 8;
            docPdf.text('Jefe de Servicio: ' + (d.jefe || '—'), M, y); y += 6;
            docPdf.text('Grupo Saliente (Entrega): ' + (d.grupoSaliente || '—'), M, y);
            docPdf.text('Grupo Entrante (Recibe): ' + (d.grupo || '—'), M, y + 6); y += 15;
            
            docPdf.setFontSize(11); docPdf.text('PERSONAL DEL SERVICIO', M, y); docPdf.line(M, y + 2, W - M, y + 2); y += 8;
            docPdf.setFontSize(9); docPdf.setFont('helvetica', 'bold');
            docPdf.text('Oficial', M, y); docPdf.text('Asistió', M + 70, y); docPdf.text('Estado', M + 90, y); docPdf.text('Responsabilidad', M + 130, y); y += 6;
            
            docPdf.setFont('helvetica', 'normal');
            if(d.personal && d.personal.length > 0){
                d.personal.forEach(function(p){
                    var nombreLimpio = p.nombre.replace(/<[^>]*>?/gm, '').trim();
                    docPdf.text(nombreLimpio, M, y); docPdf.text(p.asistio ? 'SÍ' : 'NO', M + 70, y); docPdf.text(p.estado, M + 90, y); docPdf.text((p.responsabilidades || []).join(', '), M + 130, y); y += 6;
                });
            } else { docPdf.text('No hay personal registrado.', M, y); y += 6; }
            y += 5;
            
            docPdf.setFontSize(11); docPdf.setFont('helvetica', 'bold'); docPdf.text('NOVEDADES Y OBSERVACIONES', M, y); docPdf.line(M, y + 2, W - M, y + 2); y += 8;
            docPdf.setFontSize(9); docPdf.setFont('helvetica', 'normal');
            
            var textNovedades = docPdf.splitTextToSize('Instalaciones: ' + (d.instalaciones || 'Sin novedades'), W - M*2); docPdf.text(textNovedades, M, y); y += (textNovedades.length * 5) + 2;
            var textObs = docPdf.splitTextToSize('Observaciones: ' + (d.observaciones || 'Ninguna'), W - M*2); docPdf.text(textObs, M, y); y += (textObs.length * 5) + 10;
            
            if(y > 200){ docPdf.addPage(); y = 30; }
            docPdf.setLineWidth(0.5); docPdf.line(M, y + 15, M + 60, y + 15); docPdf.text('Firma del Jefe de Servicio', M, y + 20);
            
            pieDePaginaPDF(docPdf).then(function(){ docPdf.save('Apertura_Servicio_' + fechaStr.replace(/\//g, '-') + '.pdf'); });
        });
    });
};
