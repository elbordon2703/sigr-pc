/* ============================================================
   [M4] MÓDULO OPERACIONES — JS (Recuperado)
   ============================================================ */

window.abrirModalApertura = function(){
  document.getElementById('opFecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('opHora').value = '09:00';
  document.getElementById('opGrupoEntrante').value = '';
  document.getElementById('opGrupoSaliente').value = '';
  document.getElementById('opEstadoInstalaciones').value = '';
  document.getElementById('opNovedades').value = '';
  document.getElementById('opObservaciones').value = '';
  document.getElementById('opPersonalContainer').innerHTML = '<p class="text-muted">Seleccione primero el Grupo Entrante para cargar el personal.</p>';
  document.getElementById('modalApertura').classList.add('active');
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

      html += '<tr><td>' + fecha + '</td><td>' + hora + '</td><td>' + grupo + '</td><td>' + jefe + '</td><td>' + badgeEstado + '</td><td><button class="btn btn-sm btn-secondary" disabled>Ver PDF</button></td></tr>';
    });
    tbody.innerHTML = html;
  }).catch(function(e){
    console.error('Error cargando servicios:', e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Error al cargar los servicios.</td></tr>';
  });
};

window.cargarPersonalGrupoOperaciones = function(){
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
    
    var html = '<table style="width:100%; font-size:12px; text-align:left; border-collapse: collapse;"><tr style="background:#eee;"><th style="padding:4px;">Oficial</th><th style="padding:4px; text-align:center;">Asistió</th><th style="padding:4px;">Estado</th><th style="padding:4px;">Responsabilidades (Asigne el JS)</th></tr>';
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
