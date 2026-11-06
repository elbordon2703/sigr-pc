/* ============================================================
   [M4] MÓDULO OPERACIONES — JS v3 (Guardar + Botones + Personal)
   ============================================================ */

window.guardarApertura = function(){
  var grupoEntrante = document.getElementById('opGrupoEntrante').value;
  var grupoSaliente = document.getElementById('opGrupoSaliente').value;
  
  if(!grupoEntrante || !grupoSaliente){
    alert('Debe seleccionar el Grupo Entrante y el Grupo Saliente.');
    return;
  }

  var btn = document.querySelector('button[onclick="guardarApertura()"]');
  if(btn){ btn.disabled = true; btn.textContent = 'Guardando...'; }

  var personal = [];
  var filas = document.querySelectorAll('#opPersonalContainer table tr');
  for(var i=1; i<filas.length; i++){ 
    var fila = filas[i];
    var id = fila.querySelector('.opAsistencia').getAttribute('data-id');
    var asistio = fila.querySelector('.opAsistencia').checked;
    var estado = fila.querySelector('.opEstadoOficial').value;
    var resp = fila.querySelector('.opRespOficial').value.trim();
    var nombreTd = fila.querySelector('td').innerHTML;
    
    personal.push({
      id_oficial: id,
      nombre: nombreTd,
      asistio: asistio,
      estado: estado,
      responsabilidades: resp ? resp.split(',').map(function(s){return s.trim()}) : []
    });
  }

  var fileEncuadre = document.getElementById('opFotoEncuadre').files[0];
  var filePlanilla = document.getElementById('opFotoPlanilla').files[0];
  var promesasFotos = [];
  
  if(fileEncuadre){
    promesasFotos.push(comprimirImagen(fileEncuadre, 800, 0.6).then(function(b64){ return {nombre: 'encuadre', base64: b64}; }));
  }
  if(filePlanilla){
    promesasFotos.push(comprimirImagen(filePlanilla, 800, 0.6).then(function(b64){ return {nombre: 'planilla', base64: b64}; }));
  }

  Promise.all(promesasFotos).then(function(fotos){
    var fotosObj = {};
    fotos.forEach(function(f){ fotosObj['foto_' + f.nombre] = f.base64; });

    var data = {
      fechaApertura: firebase.firestore.FieldValue.serverTimestamp(),
      grupo: grupoEntrante,
      grupoSaliente: grupoSaliente,
      jefe: 'Por asignar', 
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

window.cargarPersonalGrupoOperaciones = function() {
    var grupoSeleccionado = document.getElementById('opGrupoEntrante').value;
    var contenedor = document.getElementById('opPersonalContainer');
    if(!grupoSeleccionado){ contenedor.innerHTML = '<p class="text-muted">Seleccione primero el Grupo Entrante para cargar el personal.</p>'; return; }
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
        if(oficiales.length === 0){ contenedor.innerHTML = '<p style="color:red;">No hay oficiales asignados al ' + grupoSeleccionado + '.</p>'; return; }
        
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
      var grupo = d.grupo || '—';
      var jefe = d.jefe || '—';
      var badgeEstado = d.estado === 'abierto' ? '<span class="badge badge-success">Abierto</span>' : '<span class="badge badge-secondary">Cerrado</span>';
      
      var botones = '';
      if(d.estado === 'abierto'){
         botones = '<button class="btn btn-sm btn-secondary" onclick="verPDFServicio(\'' + doc.id + '\')">PDF</button> ';
          botones = '<button class="btn btn-sm btn-primary" onclick="editarServicio(\'' + doc.id + '\')">Editar</button> ';
          botones += '<button class="btn btn-sm btn-danger" onclick="cerrarServicio(\'' + doc.id + '\')">Cerrar</button>';
      } else {
         botones = '<button class="btn btn-sm btn-secondary" onclick="verPDFServicio(\'' + doc.id + '\')">Ver PDF</button>';
      }

      html += '<tr><td>' + fecha + '</td><td>' + hora + '</td><td>' + grupo + '</td><td>' + jefe + '</td><td>' + badgeEstado + '</td><td>' + botones + '</td></tr>';
    });
    tbody.innerHTML = html;
  }).catch(function(e){
    console.error('Error cargando servicios:', e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Error al cargar los servicios.</td></tr>';
  });
};

// Forzar que al cargar la página, estas funciones sean las que manden
window.addEventListener('load', function() {
    setTimeout(function() {
        console.log("✅ Operaciones blindado v3 cargado correctamente");
    }, 1000);
});

/* ============================================================
   FUNCIONES DE EDICIÓN Y CIERRE
   ============================================================ */

window.editarServicio = function(id) {
    db.collection('servicio').doc(id).get().then(function(doc) {
        if (!doc.exists) { alert('Servicio no encontrado.'); return; }
        var d = doc.data();
        
        // Cargar datos en el modal
        document.getElementById('opGrupoEntrante').value = d.grupo || '';
        document.getElementById('opGrupoSaliente').value = d.grupoSaliente || '';
        document.getElementById('opEstadoInstalaciones').value = d.instalaciones || '';
        document.getElementById('opNovedades').value = d.novedades || '';
        document.getElementById('opObservaciones').value = d.observaciones || '';
        
        // Cargar el personal
        if(d.personal && d.personal.length > 0) {
            var contenedor = document.getElementById('opPersonalContainer');
            var html = '<table style="width:100%; font-size:12px; text-align:left; border-collapse: collapse;"><tr style="background:#eee;"><th style="padding:4px;">Oficial</th><th style="padding:4px; text-align:center;">Asistió</th><th style="padding:4px;">Estado</th><th style="padding:4px;">Responsabilidades</th></tr>';
            
            d.personal.forEach(function(p) {
                var checked = p.asistio ? 'checked' : '';
                var resp = p.responsabilidades ? p.responsabilidades.join(', ') : '';
                var estados = ['activo', 'disponible', 'en_servicio', 'reposo', 'permiso', 'vacaciones', 'comision_municipio', 'comision_nacional', 'comision_internacional', 'apoyo_instituciones', 'apoyo_zoedan', 'apoyo_pc_municipio', 'baja'];
                var ops = ''; 
                estados.forEach(function(est){ 
                    ops += '<option value="' + est + '" ' + (p.estado === est ? 'selected' : '') + '>' + est.replace(/_/g, ' ') + '</option>'; 
                });
                
                html += '<tr style="border-bottom:1px solid #ddd;"><td style="padding:4px;">' + p.nombre + '</td><td style="padding:4px; text-align:center;"><input type="checkbox" class="opAsistencia" data-id="' + p.id_oficial + '" ' + checked + ' style="transform:scale(1.3);"></td><td style="padding:4px;"><select class="opEstadoOficial" data-id="' + p.id_oficial + '" style="font-size:11px; padding:2px;">' + ops + '</select></td><td style="padding:4px;"><input type="text" class="opRespOficial" data-id="' + p.id_oficial + '" value="' + resp + '" placeholder="Asigne función(es)..." style="width:100%; font-size:11px; padding:2px;"></td></tr>';
            });
            html += '</table>';
            contenedor.innerHTML = html;
        }
        
        // Cambiar el botón de guardar para que actualice, no cree uno nuevo
        var btn = document.querySelector('button[onclick="guardarApertura()"]');
        if(btn) {
            btn.textContent = 'Actualizar Servicio';
            btn.setAttribute('onclick', 'actualizarApertura("' + id + '")');
        }
        
        document.getElementById('modalAperturaTitulo').textContent = 'Editar Servicio';
        document.getElementById('modalApertura').classList.add('active');
    });
};

window.actualizarApertura = function(id) {
    var btn = document.querySelector('button[onclick*="actualizarApertura"]');
    if(btn){ btn.disabled = true; btn.textContent = 'Actualizando...'; }

    var grupoEntrante = document.getElementById('opGrupoEntrante').value;
    var grupoSaliente = document.getElementById('opGrupoSaliente').value;
    
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

    var data = {
        grupo: grupoEntrante,
        grupoSaliente: grupoSaliente,
        personal: personal,
        instalaciones: document.getElementById('opEstadoInstalaciones').value.trim(),
        novedades: document.getElementById('opNovedades').value.trim(),
        observaciones: document.getElementById('opObservaciones').value.trim()
    };

    db.collection('servicio').doc(id).update(data).then(function(){
        alert('¡Servicio actualizado correctamente!');
        cerrarModal('modalApertura');
        cargarOperaciones();
        if(btn){ btn.disabled = false; btn.textContent = 'Guardar Apertura'; btn.setAttribute('onclick', 'guardarApertura()'); }
        document.getElementById('modalAperturaTitulo').textContent = 'Apertura de Servicio';
    }).catch(function(e){
        alert('Error al actualizar: ' + e.message);
        if(btn){ btn.disabled = false; }
    });
};

window.cerrarServicio = function(id) {
    if(confirm('¿Está seguro de cerrar este servicio? Una vez cerrado no se podrá editar.')) {
        db.collection('servicio').doc(id).update({
            estado: 'cerrado',
            fechaCierre: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){
            alert('Servicio cerrado correctamente.');
            cargarOperaciones();
        }).catch(function(e){
            alert('Error al cerrar: ' + e.message);
        });
    }
};
