// Cualquier ruta de API que no exista responde JSON (no la página 404 de HTML).
const noEncontrada = async () => Response.json({ error: "Ruta no encontrada." }, { status: 404 });

export { noEncontrada as GET, noEncontrada as POST, noEncontrada as PUT, noEncontrada as DELETE };
