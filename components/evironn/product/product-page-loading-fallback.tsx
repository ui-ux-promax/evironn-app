export function ProductPageLoadingFallback() {
  return (
    <main
      className="product-page product-page--loading"
      aria-busy="true"
      aria-label="Загрузка страницы товара"
      style={{ minHeight: '100dvh' }}
    >
      <div className="product-page__scene product-page__loading-scene" aria-hidden="true">
        <div className="product-page__loading-orb" />
        <div className="product-page__loading-shadow" />
      </div>

      <section className="product-page__panel product-page__loading-panel" aria-hidden="true">
        <div className="product-page__panel-inner">
          <div className="product-page__loading-line product-page__loading-line--price" />
          <div className="product-page__loading-line product-page__loading-line--title" />
          <div className="product-page__loading-line product-page__loading-line--description" />
          <div className="product-page__loading-options">
            <div className="product-page__loading-line product-page__loading-line--label" />
            <div className="product-page__loading-swatches">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="product-page__loading-button" />
          <div className="product-page__loading-benefits">
            <span />
            <span />
            <span />
          </div>
          <div className="product-page__loading-rows">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </main>
  );
}
